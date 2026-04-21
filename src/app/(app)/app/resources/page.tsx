import Link from "next/link";
import { Folder, FileText, Download, Files } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { UploadDialog } from "@/components/resources/upload-dialog";
import { formatDateTime } from "@/lib/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";

export default async function ResourcesPage() {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return null;
  const supabase = await createSupabaseServerClient();

  const [foldersRes, recentRes] = await Promise.all([
    supabase
      .from("resource_folders")
      .select("id, name, description")
      .eq("workspace_id", ctx.workspaceId)
      .is("parent_folder_id", null)
      .order("name"),
    supabase
      .from("resources")
      .select("id, title, file_name, file_size, mime_type, tags, created_at, folder_id")
      .eq("workspace_id", ctx.workspaceId)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const folders = foldersRes.data ?? [];
  const recent = recentRes.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Resource Hub"
        title="Company resources"
        subtitle="One place for policies, sales collateral, operations docs, legal, and anything else your team needs."
      />
      <div className="flex justify-end">
        <UploadDialog />
      </div>

      {folders.length === 0 ? (
        <EmptyState title="No folders yet" description="Seed folders should appear automatically." icon={Folder} />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {folders.map((f) => (
            <Link
              key={f.id}
              href={`/app/resources/${f.id}`}
              className="lift-on-hover group flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--accent-100)] text-[var(--accent-700)] transition group-hover:bg-[var(--accent-600)] group-hover:text-white">
                <Folder className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div className="space-y-1">
                <p className="brand-headline text-base text-[var(--ink-950)]">{f.name}</p>
                {f.description ? (
                  <p className="text-xs text-[var(--ink-500)]">{f.description}</p>
                ) : null}
              </div>
            </Link>
          ))}
        </section>
      )}

      {recent.length > 0 ? (
        <Card className="p-0">
          <div className="border-b border-[var(--border)] px-5 py-3">
            <p className="brand-eyebrow !text-[var(--ink-500)]">Recently uploaded</p>
          </div>
          <ul className="divide-y divide-[var(--border)]">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="h-4 w-4 shrink-0 text-[var(--ink-500)]" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[var(--ink-950)]">{r.title}</p>
                    <p className="truncate text-xs text-[var(--ink-500)]">
                      {r.file_name} · {formatBytes(r.file_size ?? 0)} · {formatDateTime(r.created_at)}
                    </p>
                  </div>
                </div>
                <a
                  href={`/api/resources/${r.id}/download`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-semibold text-[var(--ink-700)] hover:border-[var(--accent-600)]/40 hover:text-[var(--accent-700)]"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <EmptyState title="No resources uploaded yet" description="Drop your first file to get started." icon={Files} />
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
