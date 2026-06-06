'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_FILE = path.join('.genesis', 'memory', 'progress.md');

function ensureFile(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (!fs.existsSync(file)) {
    fs.writeFileSync(
      file,
      '# Progress — Genesis\n\n' +
      '| Task | Status | Agente | Tokens | Commit | Nota |\n' +
      '|------|--------|--------|--------|--------|------|\n',
    );
  }
}

function statusIcon(status) {
  return { done: '✅', in_progress: '🔄', failed: '🔴', skipped: '⏭' }[status] || '⬜';
}

function append({ task, status, agent, tokens = 0, commit = '', note = '', file = DEFAULT_FILE }) {
  ensureFile(file);
  const icon = statusIcon(status);
  const tok = tokens > 0 ? tokens.toLocaleString() : '—';
  const row = `| ${task} | ${icon} | ${agent} | ${tok} | ${commit || '—'} | ${note || '—'} |\n`;
  fs.appendFileSync(file, row);
}

function updateLast({ status, commit = '', note = '', file = DEFAULT_FILE }) {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, 'utf8').split('\n');

  // Find last data row (skip headers and empty lines)
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].startsWith('|') && !lines[i].startsWith('| Task') && !lines[i].startsWith('|---')) {
      const parts = lines[i].split('|').map((p) => p.trim());
      parts[2] = statusIcon(status);
      if (commit) parts[5] = commit;
      if (note) parts[6] = note;
      lines[i] = `| ${parts.slice(1, -1).join(' | ')} |`;
      break;
    }
  }

  fs.writeFileSync(file, lines.join('\n'));
}

function read(file = DEFAULT_FILE) {
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, 'utf8');
}

function pendingTasks(file = DEFAULT_FILE) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8')
    .split('\n')
    .filter((l) => l.startsWith('|') && l.includes('⬜'))
    .map((l) => l.split('|')[1]?.trim())
    .filter(Boolean);
}

module.exports = { append, updateLast, read, pendingTasks };
