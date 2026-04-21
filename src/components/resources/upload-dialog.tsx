"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

type Props = { folderId?: string; folderName?: string };

export function UploadDialog({ folderId, folderName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    const fd = new FormData(e.currentTarget);
    if (folderId) fd.set("folderId", folderId);
    const file = fd.get("file") as File | null;
    if (!file || file.size === 0) {
      toast.error("Pick a file first");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/resources/upload", { method: "POST", body: fd });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      toast.success("Uploaded");
      setOpen(false);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch (err) {
      toast.error("Upload failed", { description: err instanceof Error ? err.message : "try again" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} size="lg">
        <Upload className="mr-2 h-4 w-4" /> Upload file
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-soft)]">
            <div className="mb-4">
              <p className="brand-eyebrow">Resource Hub</p>
              <h2 className="brand-display text-2xl text-[var(--ink-950)]">Upload file</h2>
              {folderName ? (
                <p className="text-xs text-[var(--ink-500)]">Into folder: {folderName}</p>
              ) : null}
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="file">File</FieldLabel>
                  <input
                    id="file"
                    ref={fileRef}
                    name="file"
                    type="file"
                    required
                    className="block w-full text-sm text-[var(--ink-700)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--accent-600)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[var(--accent-700)]"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="title">Title (optional)</FieldLabel>
                  <Input id="title" name="title" placeholder="Leave blank to use filename" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="description">Description (optional)</FieldLabel>
                  <Textarea id="description" name="description" rows={2} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="tags">Tags (comma-separated)</FieldLabel>
                  <Input id="tags" name="tags" placeholder="pitch-deck, q2, customer-facing" />
                </Field>
              </FieldGroup>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Upload
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
