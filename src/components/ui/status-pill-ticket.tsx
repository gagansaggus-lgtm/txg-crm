// Small helpers reused by ticket pages. Kept separate so status-pill.tsx stays focused on warehouse statuses.
import type { TicketRow } from "@/lib/supabase/queries/tickets";

export function ticketStatusTone(status: TicketRow["status"]) {
  switch (status) {
    case "open": return "info" as const;
    case "pending": return "warn" as const;
    case "resolved": return "success" as const;
    case "closed": return "neutral" as const;
  }
}

export function ticketPriorityTone(priority: TicketRow["priority"]) {
  switch (priority) {
    case "low": return "neutral" as const;
    case "normal": return "neutral" as const;
    case "high": return "warn" as const;
    case "urgent": return "danger" as const;
  }
}
