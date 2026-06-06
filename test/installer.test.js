'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { installGlobal, installProject } = require('../bin/genesis.js');

function captureOutput(callback) {
  const messages = [];
  const original = console.log;
  console.log = (...args) => messages.push(args.join(' '));
  try {
    callback();
  } finally {
    console.log = original;
  }
  return messages.join('\n');
}

function testProjectInstall() {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'genesis-project-'));
  fs.writeFileSync(path.join(project, '.gitignore'), 'node_modules/\n');

  const output = captureOutput(() => installProject(project, false));

  assert.match(output, /Claude Code: \/genesis/);
  assert.ok(fs.existsSync(path.join(project, '.agents', 'skills', 'genesis', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(project, '.claude', 'skills', 'genesis', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(project, '.opencode', 'skills', 'genesis', 'SKILL.md')));
  const command = fs.readFileSync(path.join(project, '.opencode', 'commands', 'genesis.md'), 'utf8');
  assert.match(command, /description: Orquestrador principal do Genesis Framework/);
  assert.match(command, /carregar `genesis`/);
  assert.match(fs.readFileSync(path.join(project, '.gitignore'), 'utf8'), /.genesis\/memory\//);
}

function testGlobalInstall() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'genesis-home-'));
  const output = captureOutput(() => installGlobal(false, home));

  assert.match(output, /Codex:\s+\$genesis ou \/prompts:genesis/);
  assert.ok(fs.existsSync(path.join(home, '.agents', 'skills', 'genesis', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(home, '.claude', 'skills', 'genesis', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(home, '.config', 'opencode', 'skills', 'genesis', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(home, '.config', 'opencode', 'commands', 'genesis.md')));
  assert.ok(fs.existsSync(path.join(home, '.codex', 'prompts', 'genesis.md')));
}

testProjectInstall();
testGlobalInstall();
console.log('Installer tests passed.');
