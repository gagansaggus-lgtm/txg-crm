"use client";

import { SimpleListManager } from "@/components/marketing/simple-list-manager";
import type { Influencer } from "@/lib/supabase/queries/growth";
import { upsertInfluencerAction } from "@/app/actions/growth";

const PLATFORMS = [
  { value: "youtube", label: "YouTube" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter", label: "Twitter / X" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "podcast", label: "Podcast" },
  { value: "newsletter", label: "Newsletter" },
  { value: "other", label: "Other" },
];

export function InfluencersManager({ influencers }: { influencers: Influencer[] }) {
  return (
    <SimpleListManager
      items={influencers}
      fields={[
        { key: "name", label: "Name", required: true },
        {
          key: "primary_platform",
          label: "Primary platform",
          type: "select",
          options: PLATFORMS,
          defaultValue: "linkedin",
        },
        { key: "follower_count", label: "Follower count", type: "number" },
        { key: "niche", label: "Niche / topic" },
        { key: "contact_email", label: "Contact email", type: "email" },
        { key: "contact_phone", label: "Contact phone" },
        { key: "notes", label: "Notes", type: "textarea" },
      ]}
      upsertAction={(data) =>
        upsertInfluencerAction(data as Partial<Influencer> & { name: string })
      }
      itemRender={(i: Influencer) => (
        <>
          <p className="text-sm font-semibold text-[var(--ink-950)]">{i.name}</p>
          <p className="text-xs text-[var(--ink-500)]">
            {i.primary_platform ?? "—"}
            {i.niche ? ` · ${i.niche}` : ""}
            {i.follower_count
              ? ` · ${(i.follower_count / 1000).toFixed(1)}K followers`
              : ""}
          </p>
          {i.contact_email ? (
            <p className="text-xs text-[var(--accent-600)]">{i.contact_email}</p>
          ) : null}
        </>
      )}
      newButtonLabel="Add influencer"
      emptyMessage="No influencers tracked yet. Add D2C podcasters, business YouTubers, supply chain voices."
    />
  );
}
