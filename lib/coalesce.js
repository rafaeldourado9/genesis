'use strict';

// Batch multiple LLM requests that arrive within WINDOW_MS into a single call.
// Saves tokens and round-trips when multiple small subtasks are queued together.

const WINDOW_MS = 80;

let queue = [];
let timer = null;
let _callFn = null;

function init(callFn) {
  _callFn = callFn;
}

function submit(params) {
  if (!_callFn) throw new Error('coalesce.init(callFn) not called');

  return new Promise((resolve, reject) => {
    queue.push({ params, resolve, reject });
    if (!timer) timer = setTimeout(flush, WINDOW_MS);
  });
}

async function flush() {
  timer = null;
  const batch = queue.splice(0);
  if (batch.length === 0) return;

  // Single request — pass through directly
  if (batch.length === 1) {
    try { batch[0].resolve(await _callFn(batch[0].params)); }
    catch (e) { batch[0].reject(e); }
    return;
  }

  // Multiple requests — combine into one structured prompt
  const base = batch[0].params;
  const combined = batch
    .map((b, i) => {
      const last = b.params.messages[b.params.messages.length - 1];
      return `### Subtarefa ${i + 1}\n${last.content}`;
    })
    .join('\n\n---\n\n');

  const batchedMessages = [
    ...base.messages.slice(0, -1),
    {
      role: 'user',
      content:
        `Responda cada subtarefa abaixo NA ORDEM, prefixando cada resposta com "### Resposta N".\n\n${combined}`,
    },
  ];

  try {
    const result = await _callFn({ ...base, messages: batchedMessages });
    const parts = result.content.split(/###\s*Resposta\s*\d+/i).slice(1);

    // Distribute tokens proportionally
    const tokensEach = Math.round((result.tokens.output || 0) / batch.length);

    batch.forEach((b, i) => {
      b.resolve({
        ...result,
        content: (parts[i] || result.content).trim(),
        tokens: {
          ...result.tokens,
          // Input tokens shared across batch; output divided evenly
          input: Math.round((result.tokens.input || 0) / batch.length),
          output: tokensEach,
        },
        batched: true,
        batchSize: batch.length,
      });
    });
  } catch (e) {
    batch.forEach((b) => b.reject(e));
  }
}

module.exports = { init, submit };
