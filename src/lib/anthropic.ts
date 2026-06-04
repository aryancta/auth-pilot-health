// Minimal Anthropic Messages API client. The key is supplied per-request by the
// user (from localStorage via a request header) and is never stored server-side.

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-3-5-sonnet-20241022";

export interface ClaudeResult {
  text: string;
  model: string;
}

export async function callClaude(
  apiKey: string,
  system: string,
  prompt: string,
  maxTokens = 1024
): Promise<ClaudeResult> {
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
    model?: string;
  };
  const text =
    data.content?.map((b) => b.text || "").join("").trim() || "";
  return { text, model: data.model || MODEL };
}
