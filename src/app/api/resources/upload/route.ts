import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";
import { logActivity } from "@/lib/brain/activity-log";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const folderId = form.get("folderId") as string | null;
  const title = (form.get("title") as string | null)?.trim() || file?.name || "Untitled";
  const description = (form.get("description") as string | null)?.trim() || null;
  const tagsRaw = (form.get("tags") as string | null) ?? "";
  const tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);

  if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${ctx.workspaceId}/${folderId ?? "root"}/${Date.now()}_${safeName}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const upload = await supabase.storage.from("resources").upload(path, buf, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (upload.error) return NextResponse.json({ error: upload.error.message }, { status: 500 });

  const { data: row, error: insertError } = await supabase
    .from("resources")
    .insert({
      workspace_id: ctx.workspaceId,
      folder_id: folderId ?? null,
      title,
      description,
      file_path: path,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || null,
      tags,
      uploaded_by: ctx.user.id,
    })
    .select("id")
    .single();
  if (insertError || !row) {
    await supabase.storage.from("resources").remove([path]);
    return NextResponse.json({ error: insertError?.message ?? "could not save metadata" }, { status: 500 });
  }

  await logActivity(supabase, {
    workspaceId: ctx.workspaceId,
    actorId: ctx.user.id,
    action: "resource_uploaded",
    entityType: "resource",
    entityId: row.id,
    summary: `Uploaded "${title}"`,
    metadata: { size: file.size, mime: file.type, folder_id: folderId },
  });

  return NextResponse.json({ ok: true, id: row.id });
}
