import { CRM_TOOLS } from "@/lib/ai/tools";

// Converts our Anthropic-format tool definitions to OpenAI/OpenRouter function format.
// Keep this deterministic (sorted fields) so the request-prefix stays cacheable.
export const CRM_TOOLS_OPENAI = CRM_TOOLS.map((t) => ({
  type: "function" as const,
  function: {
    name: t.name,
    description: t.description,
    parameters: t.input_schema as Record<string, unknown>,
  },
}));
