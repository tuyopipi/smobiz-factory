export function providerFromEnv({ provider, model, temperature }) {
  const name = provider || process.env.MODEL_PROVIDER || process.env.LLM_PROVIDER || "openai";
  const selectedModel = model || process.env.MODEL_NAME || process.env.OPENAI_MODEL || process.env.ANTHROPIC_MODEL || "gpt-4.1-mini";
  return {
    name,
    model: selectedModel,
    temperature: Number(temperature ?? process.env.MODEL_TEMPERATURE ?? process.env.OPENAI_TEMPERATURE ?? 0.7),
    baseUrl: process.env.OPENAI_BASE_URL || process.env.LOCAL_MODEL_BASE_URL || "https://api.openai.com/v1"
  };
}

export async function completeAction({ provider, messages }) {
  const result = await completeJson({ provider, messages });
  return { action: result.json, tokens: result.tokens };
}

export async function completeJson({ provider, messages }) {
  if (provider.name === "anthropic") return completeAnthropic({ provider, messages });
  if (provider.name === "openai-compatible" || provider.name === "local") return completeOpenAICompatible({ provider, messages, apiKeyEnv: "OPENAI_API_KEY", allowMissingKey: provider.name === "local" });
  if (provider.name === "openai") return completeOpenAICompatible({ provider, messages, apiKeyEnv: "OPENAI_API_KEY", allowMissingKey: false });
  throw new Error(`Unsupported MODEL_PROVIDER=${provider.name}. Use openai, anthropic, openai-compatible, or local.`);
}

async function completeOpenAICompatible({ provider, messages, apiKeyEnv, allowMissingKey }) {
  const apiKey = process.env[apiKeyEnv];
  if (!apiKey && !allowMissingKey) throw new Error(`${apiKeyEnv} is required for MODEL_PROVIDER=${provider.name}.`);
  const response = await fetchWith429Retry(`${provider.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {})
    },
    body: JSON.stringify({
      model: provider.model,
      temperature: provider.temperature,
      messages,
      response_format: { type: "json_object" }
    })
  });
  if (!response.ok) throw new Error(`${provider.name} API error ${response.status}: ${await response.text()}`);
  const body = await response.json();
  const content = body.choices?.[0]?.message?.content ?? "{}";
  return {
    json: JSON.parse(content),
    tokens: Number(body.usage?.total_tokens ?? estimateTokens(messages.map((message) => message.content).join("\n") + content))
  };
}

async function completeAnthropic({ provider, messages }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is required for MODEL_PROVIDER=anthropic.");
  const system = messages.find((message) => message.role === "system")?.content || "";
  const userMessages = messages.filter((message) => message.role !== "system").map((message) => ({
    role: message.role === "assistant" ? "assistant" : "user",
    content: message.content
  }));
  const response = await fetchWith429Retry("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: provider.model,
      temperature: provider.temperature,
      max_tokens: 1000,
      system,
      messages: userMessages
    })
  });
  if (!response.ok) throw new Error(`Anthropic API error ${response.status}: ${await response.text()}`);
  const body = await response.json();
  const content = body.content?.find((part) => part.type === "text")?.text ?? "{}";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  return {
    json: JSON.parse(jsonMatch ? jsonMatch[0] : content),
    tokens: Number((body.usage?.input_tokens ?? 0) + (body.usage?.output_tokens ?? 0)) || estimateTokens(system + JSON.stringify(userMessages) + content)
  };
}

async function fetchWith429Retry(url, options, maxRetries = 5) {
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const response = await fetch(url, options);
    if (response.status !== 429) return response;
    if (attempt === maxRetries) return response;
    const retryAfter = response.headers.get("retry-after");
    const retryMs = retryAfter ? Number(retryAfter) * 1000 : Math.min(60_000, 2 ** attempt * 3000);
    await sleep(Number.isFinite(retryMs) && retryMs > 0 ? retryMs : 10_000);
  }
}

function estimateTokens(text) {
  return Math.ceil(String(text).length / 4);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
