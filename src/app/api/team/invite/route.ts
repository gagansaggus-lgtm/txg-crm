import { NextResponse } from "next/server";
import crypto from "node:crypto";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspaceContext } from "@/lib/supabase/workspace";
import { logActivity } from "@/lib/brain/activity-log";

export const runtime = "nodejs";

const VALID_ROLES = new Set([
  "admin", "ops_lead", "ops_rep", "warehouse_lead", "warehouse_staff", "driver", "sales",
]);

export async function POST(req: Request) {
  const ctx = await loadWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (ctx.role !== "admin") return NextResponse.json({ error: "admin only" }, { status: 403 });

  const body = (await req.json()) as { email: string; role: string };
  const email = body.email?.trim().toLowerCase();
  if (!email || !email.includes("@")) return NextResponse.json({ error: "valid email required" }, { status: 400 });
  if (!VALID_ROLES.has(body.role)) return NextResponse.json({ error: "invalid role" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("workspace_invites")
    .upsert(
      {
        workspace_id: ctx.workspaceId,
        email,
        role: body.role,
        token,
        invited_by: ctx.user.id,
        expires_at: expiresAt,
        accepted_at: null,
        revoked_at: null,
      },
      { onConflict: "workspace_id,email" },
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logActivity(supabase, {
    workspaceId: ctx.workspaceId,
    actorId: ctx.user.id,
    action: "invite_sent",
    entityType: "workspace_invite",
    summary: `Invited ${email} as ${body.role}`,
    metadata: { email, role: body.role },
  });

  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  const inviteUrl = `${origin}/invite/${token}`;

  // Best-effort email via Resend if configured; otherwise return the link for the admin to copy.
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? "TXG CRM <invites@transwayxpress.com>",
        to: email,
        subject: "You've been invited to TXG CRM",
        html: `
          <div style="font-family:Manrope,system-ui,sans-serif;max-width:480px;padding:24px;color:#0c0c0c">
            <p style="color:#f75928;font-weight:700;letter-spacing:.24em;text-transform:uppercase;font-size:11px;margin:0">Transway Xpress Global</p>
            <h1 style="font-size:28px;margin:8px 0 16px">You're invited to the TXG workspace</h1>
            <p style="line-height:1.6">${ctx.user.fullName || "An admin"} invited you to join as <strong>${body.role}</strong>.</p>
            <p style="margin:24px 0"><a href="${inviteUrl}" style="background:#f75928;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;display:inline-block">Accept invite</a></p>
            <p style="color:#74787c;font-size:13px">Link expires in 7 days. If the button doesn't work, paste this URL: <br><span style="word-break:break-all">${inviteUrl}</span></p>
          </div>
        `,
      });
    } catch (err) {
      console.warn("[invite] resend send failed:", err);
    }
  }

  return NextResponse.json({ ok: true, inviteUrl });
}
