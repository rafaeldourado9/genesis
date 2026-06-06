'use strict';

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');
const { Writable } = require('stream');

const VAULT_FILE = path.join(os.homedir(), '.genesis', 'vault.json');
const ALGO = 'aes-256-gcm';
const PBKDF2_ITER = 120_000;
const KEY_LEN = 32;

let _sessionKey = null;

function ensureDir(p) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
}

function deriveKey(passphrase, salt) {
  return crypto.pbkdf2Sync(passphrase, salt, PBKDF2_ITER, KEY_LEN, 'sha256');
}

function encryptValue(key, plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const data = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return {
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: data.toString('base64'),
  };
}

function decryptValue(key, iv, tag, data) {
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(data, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

function promptPassword(question) {
  if (process.env.GENESIS_VAULT_PASSPHRASE) return Promise.resolve(process.env.GENESIS_VAULT_PASSPHRASE);

  // Suppress echo by using a silent writable stream as output
  const muted = new Writable({ write: (_c, _e, cb) => cb() });
  const rl = readline.createInterface({ input: process.stdin, output: muted, terminal: true });
  process.stderr.write(question);

  return new Promise((resolve) => {
    rl.question('', (answer) => {
      process.stderr.write('\n');
      rl.close();
      resolve(answer);
    });
  });
}

function loadRaw() {
  if (!fs.existsSync(VAULT_FILE)) return null;
  return JSON.parse(fs.readFileSync(VAULT_FILE, 'utf8'));
}

function saveRaw(data) {
  ensureDir(VAULT_FILE);
  fs.writeFileSync(VAULT_FILE, JSON.stringify(data, null, 2), { mode: 0o600 });
}

async function openVault(create = false) {
  if (_sessionKey) return _sessionKey;

  const raw = loadRaw();

  if (!raw) {
    if (!create) throw new Error('Vault nao encontrado. Execute: genesis-run setup');
    const pass = await promptPassword('Nova senha do vault Genesis: ');
    if (!pass) throw new Error('Senha nao pode ser vazia');
    const salt = crypto.randomBytes(32).toString('base64');
    const key = deriveKey(pass, salt);
    saveRaw({ salt, keys: {} });
    _sessionKey = { key };
    return _sessionKey;
  }

  const pass = await promptPassword('Senha do vault Genesis: ');
  const key = deriveKey(pass, raw.salt);

  // Verify correctness against any existing entry
  const entries = Object.values(raw.keys || {});
  if (entries.length > 0) {
    try {
      decryptValue(key, entries[0].iv, entries[0].tag, entries[0].data);
    } catch {
      throw new Error('Senha incorreta');
    }
  }

  _sessionKey = { key };
  return _sessionKey;
}

async function set(name, value) {
  const { key } = await openVault(true);
  const raw = loadRaw();
  raw.keys[name] = encryptValue(key, value);
  saveRaw(raw);
}

async function get(name) {
  const raw = loadRaw();
  if (!raw || !raw.keys[name]) return null;
  const { key } = await openVault(false);
  const e = raw.keys[name];
  return decryptValue(key, e.iv, e.tag, e.data);
}

function list() {
  const raw = loadRaw();
  return Object.keys(raw?.keys || {});
}

async function remove(name) {
  await openVault(false);
  const raw = loadRaw();
  delete raw.keys[name];
  saveRaw(raw);
}

// Env vars take priority over vault
async function getOrEnv(name) {
  if (process.env[name]) return process.env[name];
  try { return await get(name); } catch { return null; }
}

// Unlock vault once at CLI start to avoid repeated prompts
async function unlock() {
  return openVault(false);
}

module.exports = { set, get, list, remove, getOrEnv, unlock };
