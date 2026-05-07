"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { promoteLeadToAbmAction } from "@/app/actions/abm";

export function PromoteToAbmButton({
  leadId,
  alreadyPromoted,
}: {
  leadId: string;
  alreadyPromoted?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (alreadyPromoted) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Star className="mr-1 h-3.5 w-3.5 fill-current" />
        ABM account
      </Button>
    );
  }

  function promote() {
    startTransition(async () => {
      const res = await promoteLeadToAbmAction(leadId);
      if (!res.ok) toast.error("Failed", { description: res.error });
      else {
        toast.success("Promoted to Tier 1 ABM");
        router.refresh();
      }
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={promote} disabled={pending}>
      <Star className="mr-1 h-3.5 w-3.5" />
      Promote to ABM
    </Button>
  );
}
