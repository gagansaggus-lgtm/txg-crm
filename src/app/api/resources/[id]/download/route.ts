import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await loadWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = await createSupabaseServerClient();
  const { data: row } = await supabase
    .from("resources")
    .select("id, workspace_id, file_path, file_name, mime_type")
    .eq("id", id)
    .maybeSingle();
  if (!row || row.workspace_id !== ctx.workspaceId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const { data: signed, error } = await supabase.storage
    .from("resources")
    .createSignedUrl(row.file_path, 60);
  if (error || !signed?.signedUrl) {
    return NextResponse.json({ error: error?.message ?? "could not sign url" }, { status: 500 });
  }

  await supabase.rpc("noop", {}).then(() => null);
  await supabase.from("resources").update({ download_count: 1 }).eq("id", id).select();

  return NextResponse.redirect(signed.signedUrl, { status: 307 });
}
