import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, FileText, Files } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { UploadDialog } from "@/components/resources/upload-dialog";
import { formatDateTime } from "@/lib/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

type PageProps = { params: Promise<{ folderId: string }> };

export default async function ResourceFolderPage({ params }: PageProps) {
  const { folderId } = await params;
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();

  const { data: folder } = await supabase
    .from("resource_folders")
    .select("id, name, description")
    .eq("id", folderId)
    .eq("workspace_id", ctx.workspaceId)
    .maybeSingle();
  if (!folder) notFound();

  const { data: resources } = await supabase
    .from("resources")
    .select("id, title, description, file_name, file_size, mime_type, tags, download_count, created_at")
    .eq("workspace_id", ctx.workspaceId)
    .eq("folder_id", folderId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <Link
        href="/app/resources"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-500)] hover:text-[var(--ink-950)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All folders
      </Link>
      <PageHeader
        eyebrow="Resource Hub"
        title={folder.name}
        subtitle={folder.description ?? "All files in this folder."}
      />
      <div className="flex justify-end">
        <UploadDialog folderId={folder.id} folderName={folder.name} />
      </div>

      {(resources ?? []).length === 0 ? (
        <EmptyState title="Empty folder" description="Drop your first file to get started." icon={Files} />
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-[var(--border)]">
            {resources!.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="h-5 w-5 shrink-0 text-[var(--accent-600)]" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--ink-950)]">{r.title}</p>
                    {r.description ? (
                      <p className="line-clamp-1 text-xs text-[var(--ink-500)]">{r.description}</p>
                    ) : null}
                    <p className="truncate text-[11px] text-[var(--ink-500)]">
                      {r.file_name} · {formatBytes(r.file_size ?? 0)} · added {formatDateTime(r.created_at)}
                    </p>
                    {(r.tags ?? []).length ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(r.tags ?? []).map((t: string) => (
                          <span key={t} className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--ink-500)]">
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <a
                  href={`/api/resources/${r.id}/download`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-700)] hover:border-[var(--accent-600)]/40 hover:text-[var(--accent-700)]"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function formatBytes(n: number): string {
  if (!n) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return `${(n / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
