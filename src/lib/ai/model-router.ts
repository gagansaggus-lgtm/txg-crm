// Intent-based model router. Maps a user message + context to the cheapest model
// that will do the job well. All models routed via OpenRouter — one key, one billing.

export type ModelRoute = {
  model: string;
  reasoning: string;
  supportsThinking: boolean;
  cacheable: boolean;
};

const QUICK_LOOKUP = /\b(status|where is|show me|list|whats|what's|who is|find|track|lookup|search|how many|count|pending|open)\b/i;
const DEEP_REASON = /\b(audit|investigate|deep dive|full analysis|compare all|compare across|strategy|plan the|recommend.*approach)\b/i;
const REASONING = /\b(why|explain|plan|analyze|compare|draft|remember|recommend|suggest|summarize|review)\b/i;

export function pickModel(message: string): ModelRoute {
  const msg = message.trim();
  // Very short queries (<20 chars) or quick-lookup patterns → cheap model
  if (msg.length < 20 || QUICK_LOOKUP.test(msg)) {
    return {
      model: "openai/gpt-4.1-nano",
      reasoning: "quick-lookup: short or matches lookup pattern",
      supportsThinking: false,
      cacheable: false,
    };
  }
  // Heavy analysis → top-tier
  if (DEEP_REASON.test(msg)) {
    return {
      model: "anthropic/claude-opus-4-7",
      reasoning: "deep-reasoning: audit/strategy pattern",
      supportsThinking: true,
      cacheable: true,
    };
  }
  // Reasoning / multi-step / memory writes → Sonnet
  if (REASONING.test(msg)) {
    return {
      model: "anthropic/claude-sonnet-4-6",
      reasoning: "reasoning: explanation or multi-step",
      supportsThinking: true,
      cacheable: true,
    };
  }
  // Safe default: Sonnet for anything ambiguous
  return {
    model: "anthropic/claude-sonnet-4-6",
    reasoning: "default: ambiguous intent",
    supportsThinking: true,
    cacheable: true,
  };
}
