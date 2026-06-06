'use strict';

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CACHE_DIR = path.join(os.homedir(), '.genesis', 'cache');
const DEFAULT_TTL = 3600; // seconds

function cacheKey(provider, model, messages) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify({ provider, model, messages }))
    .digest('hex');
}

function cacheFile(key) {
  return path.join(CACHE_DIR, `${key.slice(0, 32)}.json`);
}

function get(provider, model, messages, ttl = DEFAULT_TTL) {
  const file = cacheFile(cacheKey(provider, model, messages));
  if (!fs.existsSync(file)) return null;

  try {
    const entry = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (Date.now() - entry.ts > ttl * 1000) {
      fs.unlinkSync(file);
      return null;
    }
    return entry.response;
  } catch {
    return null;
  }
}

function set(provider, model, messages, response) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const file = cacheFile(cacheKey(provider, model, messages));
  fs.writeFileSync(file, JSON.stringify({ ts: Date.now(), response }));
}

function clear() {
  if (!fs.existsSync(CACHE_DIR)) return 0;
  const files = fs.readdirSync(CACHE_DIR).filter((f) => f.endsWith('.json'));
  for (const f of files) fs.unlinkSync(path.join(CACHE_DIR, f));
  return files.length;
}

function stats() {
  if (!fs.existsSync(CACHE_DIR)) return { entries: 0, sizeKb: 0 };
  const files = fs.readdirSync(CACHE_DIR).filter((f) => f.endsWith('.json'));
  const size = files.reduce((s, f) => s + fs.statSync(path.join(CACHE_DIR, f)).size, 0);
  return { entries: files.length, sizeKb: Math.round(size / 1024) };
}

module.exports = { get, set, clear, stats };
