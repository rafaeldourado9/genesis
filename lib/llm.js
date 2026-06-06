'use strict';

// Model aliases → real IDs
const MODELS = {
  // Anthropic
  'claude-haiku': 'claude-haiku-4-5-20251001',
  'claude-sonnet': 'claude-sonnet-4-6',
  'claude-opus': 'claude-opus-4-8',
  // OpenAI
  'gpt-mini': 'gpt-4o-mini',
  'gpt': 'gpt-4o',
  'o1-mini': 'o1-mini',
  // Google
  'gemini-flash': 'gemini-1.5-flash',
  'gemini-pro': 'gemini-1.5-pro',
  'gemini-2-flash': 'gemini-2.0-flash',
};

function resolveModel(model) {
  return MODELS[model] || model;
}

// ── Anthropic ────────────────────────────────────────────────────────────────

async function callClaude({ apiKey, model, messages, system, maxTokens = 8192 }) {
  const body = { model: resolveModel(model), max_tokens: maxTokens, messages };
  if (system) body.system = [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }];

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Claude ${res.status}: ${data.error?.message || JSON.stringify(data)}`);

  return {
    content: data.content[0].text,
    tokens: {
      input: data.usage.input_tokens,
      output: data.usage.output_tokens,
      cache_read: data.usage.cache_read_input_tokens || 0,
      cache_write: data.usage.cache_creation_input_tokens || 0,
    },
    model: data.model,
    provider: 'anthropic',
  };
}

// ── OpenAI ───────────────────────────────────────────────────────────────────

async function callOpenAI({ apiKey, model, messages, system, maxTokens = 4096 }) {
  const msgs = system ? [{ role: 'system', content: system }, ...messages] : messages;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: resolveModel(model), max_tokens: maxTokens, messages: msgs }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${data.error?.message || JSON.stringify(data)}`);

  return {
    content: data.choices[0].message.content,
    tokens: {
      input: data.usage.prompt_tokens,
      output: data.usage.completion_tokens,
      cache_read: data.usage.prompt_tokens_details?.cached_tokens || 0,
      cache_write: 0,
    },
    model: data.model,
    provider: 'openai',
  };
}

// ── Google Gemini ────────────────────────────────────────────────────────────

async function callGemini({ apiKey, model, messages, system, maxTokens = 4096 }) {
  const fullModel = resolveModel(model);
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body = {
    contents,
    generationConfig: { maxOutputTokens: maxTokens },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${fullModel}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${data.error?.message || JSON.stringify(data)}`);

  return {
    content: data.candidates[0].content.parts[0].text,
    tokens: {
      input: data.usageMetadata?.promptTokenCount || 0,
      output: data.usageMetadata?.candidatesTokenCount || 0,
      cache_read: data.usageMetadata?.cachedContentTokenCount || 0,
      cache_write: 0,
    },
    model: data.modelVersion || fullModel,
    provider: 'gemini',
  };
}

// ── Unified call ─────────────────────────────────────────────────────────────

const DISPATCHERS = {
  anthropic: callClaude,
  claude: callClaude,
  openai: callOpenAI,
  gemini: callGemini,
  google: callGemini,
};

async function call(params) {
  const dispatch = DISPATCHERS[params.provider];
  if (!dispatch) throw new Error(`Provider desconhecido: ${params.provider}. Use: anthropic, openai, gemini`);
  return dispatch(params);
}

// Run same prompt on multiple providers simultaneously
async function parallel(requests) {
  return Promise.all(requests.map(call));
}

module.exports = { call, parallel, MODELS, resolveModel };
