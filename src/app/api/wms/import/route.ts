import { NextResponse } from "next/server";

import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";
import { CsvWmsAdapter } from "@/lib/wms/csv-adapter";
import { runImport } from "@/lib/wms/import";
import type { WmsEntity } from "@/lib/wms/adapter";

const ALLOWED: WmsEntity[] = ["skus", "receipts", "orders", "shipments"];

export async function POST(request: Request) {
  if (!hasSupabaseEnv) {
    return NextResponse.json({ error: "Supabase not configured." }, { status: 500 });
  }

  // Dual auth: session cookie (for in-app uploads) OR WMS_IMPORT_SECRET header (for cron/external).
  const headerSecret = request.headers.get("x-wms-secret") ?? "";
  const expectedSecret = process.env.WMS_IMPORT_SECRET ?? "";

  let workspaceId: string | null = null;
  let userId: string | null = null;

  if (expectedSecret && headerSecret && headerSecret === expectedSecret) {
    // Trusted caller. Look up the TXG workspace by slug.
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.from("workspaces").select("id").eq("slug", "txg").maybeSingle();
    workspaceId = data?.id ?? null;
  } else {
    const ctx = await loadWorkspaceContext();
    if (!ctx) {
      return NextResponse.json({ error: "Not authorized." }, { status: 401 });
    }
    workspaceId = ctx.workspaceId;
    userId = ctx.user.id;
  }

  if (!workspaceId) {
    return NextResponse.json({ error: "TXG workspace not found." }, { status: 500 });
  }

  const formData = await request.formData();
  const entity = String(formData.get("entity") ?? "") as WmsEntity;
  const file = formData.get("file");

  if (!ALLOWED.includes(entity)) {
    return NextResponse.json({ error: `Invalid entity. Expected one of ${ALLOWED.join(", ")}.` }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }

  const csv = await file.text();
  const adapter = new CsvWmsAdapter();

  const supabase = await createSupabaseServerClient();

  const logInsert = await supabase
    .from("wms_integration_log")
    .insert({
      workspace_id: workspaceId,
      source: "csv",
      entity,
      file_name: file.name,
      created_by: userId,
    })
    .select("id")
    .single();
  const logId = logInsert.data?.id;

  try {
    const rows = await adapter.parseCsv(entity, csv);
    const result = await runImport(supabase, workspaceId, entity, rows);

    if (logId) {
      await supabase
        .from("wms_integration_log")
        .update({
          run_ended_at: new Date().toISOString(),
          rows_in: result.rowsIn,
          rows_ok: result.rowsOk,
          rows_failed: result.rowsFailed,
          error: result.errors.slice(0, 5).join("\n") || null,
        })
        .eq("id", logId);
    }

    await supabase
      .from("wms_sync_cursor")
      .upsert(
        {
          workspace_id: workspaceId,
          source: "csv",
          entity,
          last_run_at: new Date().toISOString(),
        },
        { onConflict: "workspace_id,source,entity" },
      );

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed";
    if (logId) {
      await supabase
        .from("wms_integration_log")
        .update({ run_ended_at: new Date().toISOString(), error: message })
        .eq("id", logId);
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
