"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, Send, Loader2, Wrench, CircleCheck } from "lucide-react";

import { cn } from "@/lib/utils";

type ChatMessage =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; text: string; streaming?: boolean; model?: string }
  | { id: string; role: "tool"; name: string; status: "running" | "done"; summary?: string };

export function AiWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape" && open) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setLoading(true);
    const userId = crypto.randomUUID();
    const assistantId = crypto.randomUUID();
    setMessages((m) => [
      ...m,
      { id: userId, role: "user", text },
      { id: assistantId, role: "assistant", text: "", streaming: true },
    ]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message: text,
          pageContext: { route: pathname },
        }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const events = buf.split("\n\n");
        buf = events.pop() ?? "";
        for (const evt of events) {
          const lines = evt.split("\n");
          const eventLine = lines.find((l) => l.startsWith("event:"));
          const dataLine = lines.find((l) => l.startsWith("data:"));
          if (!eventLine || !dataLine) continue;
          const eventName = eventLine.slice(6).trim();
          const payload = JSON.parse(dataLine.slice(5).trim());
          if (eventName === "conversation") {
            setConversationId(payload.conversationId);
          } else if (eventName === "model") {
            setMessages((m) =>
              m.map((msg) =>
                msg.id === assistantId && msg.role === "assistant"
                  ? { ...msg, model: payload.model }
                  : msg,
              ),
            );
          } else if (eventName === "delta") {
            setMessages((m) =>
              m.map((msg) =>
                msg.id === assistantId && msg.role === "assistant"
                  ? { ...msg, text: msg.text + payload.text }
                  : msg,
              ),
            );
          } else if (eventName === "tool_use") {
            const toolId = `tool-${payload.id}`;
            setMessages((m) => [...m, { id: toolId, role: "tool", name: payload.name, status: "running" }]);
          } else if (eventName === "tool_result") {
            setMessages((m) =>
              m.map((msg) =>
                msg.role === "tool" && msg.id === `tool-${payload.id}`
                  ? { ...msg, status: "done" as const, summary: summarize(payload.result) }
                  : msg,
              ),
            );
          } else if (eventName === "error") {
            setMessages((m) =>
              m.map((msg) =>
                msg.id === assistantId && msg.role === "assistant"
                  ? { ...msg, text: `⚠️ ${payload.message}`, streaming: false }
                  : msg,
              ),
            );
          } else if (eventName === "done") {
            setMessages((m) =>
              m.map((msg) =>
                msg.id === assistantId && msg.role === "assistant" ? { ...msg, streaming: false } : msg,
              ),
            );
          }
        }
      }
    } catch (err) {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId && msg.role === "assistant"
            ? { ...msg, text: `⚠️ ${err instanceof Error ? err.message : "request failed"}`, streaming: false }
            : msg,
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating launcher */}
      <button
        type="button"
        aria-label="Open TXG AI assistant"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed bottom-6 right-6 z-50 hidden h-14 w-14 place-items-center rounded-full shadow-[var(--shadow-cta)] transition",
          "cta-primary text-white",
          "lg:grid",
        )}
      >
        <Sparkles className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
            className="fixed inset-0 z-50 flex items-end justify-end p-4 lg:bottom-24 lg:right-6 lg:inset-auto"
          >
            <div
              aria-hidden
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm lg:hidden"
            />
            <section className="relative flex h-[min(640px,90vh)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-soft)]">
              <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--accent-600)] text-white">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="brand-headline text-sm text-[var(--ink-950)]">TXG Assistant</p>
                    <p className="text-[11px] text-[var(--ink-500)]">⌘K to toggle · via OpenRouter</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-7 w-7 place-items-center rounded-lg text-[var(--ink-500)] hover:bg-[var(--secondary)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
                {messages.length === 0 ? (
                  <EmptyChatHint onPick={(prompt) => setInput(prompt)} />
                ) : (
                  messages.map((m) =>
                    m.role === "tool" ? (
                      <ToolRow key={m.id} name={m.name} status={m.status} summary={m.summary} />
                    ) : (
                      <MessageBubble
                        key={m.id}
                        role={m.role}
                        text={m.text}
                        streaming={m.role === "assistant" ? m.streaming : undefined}
                        model={m.role === "assistant" ? m.model : undefined}
                      />
                    ),
                  )
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void send();
                }}
                className="flex items-end gap-2 border-t border-[var(--border)] bg-[var(--background)] p-3"
              >
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  placeholder="Ask about customers, shipments, how to do something…"
                  rows={1}
                  className="max-h-40 flex-1 resize-none rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-600)]"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="cta-primary grid h-9 w-9 shrink-0 place-items-center rounded-lg disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MessageBubble({ role, text, streaming, model }: { role: "user" | "assistant"; text: string; streaming?: boolean; model?: string }) {
  return (
    <div className={cn("flex flex-col gap-1", role === "user" ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          role === "user"
            ? "bg-[var(--accent-600)] text-white"
            : "border border-[var(--border)] bg-[var(--background)] text-[var(--ink-950)]",
        )}
      >
        {text || (streaming ? <span className="text-[var(--ink-500)]">Thinking…</span> : null)}
        {streaming && text ? <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-current" /> : null}
      </div>
      {role === "assistant" && model ? (
        <p className="px-1 text-[10px] uppercase tracking-wide text-[var(--ink-400)]">{model}</p>
      ) : null}
    </div>
  );
}

function ToolRow({ name, status, summary }: { name: string; status: "running" | "done"; summary?: string }) {
  return (
    <div className="flex items-start gap-2 text-xs text-[var(--ink-500)]">
      {status === "running" ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent-600)]" />
      ) : (
        <CircleCheck className="h-3.5 w-3.5 text-[var(--success-700)]" />
      )}
      <div className="flex items-center gap-1.5">
        <Wrench className="h-3 w-3" />
        <span className="font-mono">{name}</span>
        {summary ? <span className="text-[var(--ink-700)]">· {summary}</span> : null}
      </div>
    </div>
  );
}

function EmptyChatHint({ onPick }: { onPick: (p: string) => void }) {
  const hints = [
    "What's happening across the warehouse today?",
    "How do I add a new customer?",
    "Show me open shipment exceptions.",
    "Remember that Acme prefers FedEx Ground.",
  ];
  return (
    <div className="space-y-3 py-4 text-center">
      <p className="brand-display text-2xl text-[var(--ink-950)]">Hi — how can I help?</p>
      <p className="text-xs text-[var(--ink-500)]">
        I can search the CRM, explain how features work, and remember things you tell me.
      </p>
      <div className="space-y-1.5 pt-2">
        {hints.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => onPick(h)}
            className="block w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-left text-xs text-[var(--ink-700)] transition hover:border-[var(--accent-600)]/40 hover:text-[var(--ink-950)]"
          >
            {h}
          </button>
        ))}
      </div>
    </div>
  );
}

function summarize(result: unknown): string {
  if (result && typeof result === "object" && "error" in result) {
    return `error: ${(result as { error: string }).error}`;
  }
  if (Array.isArray(result)) return `${result.length} rows`;
  if (result && typeof result === "object") {
    const r = result as Record<string, unknown>;
    if (Array.isArray(r.customers)) return `${(r.customers as unknown[]).length} customers`;
    if (Array.isArray(r.memories)) return `${(r.memories as unknown[]).length} memories`;
    if (Array.isArray(r.activity)) return `${(r.activity as unknown[]).length} events`;
    if (r.customer) return "customer loaded";
    if (r.shipment) return "shipment found";
    if (r.memory_id) return "memory saved";
  }
  return "done";
}
