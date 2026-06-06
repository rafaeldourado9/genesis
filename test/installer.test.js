'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { installGlobal, installProject, validateState, verifySkillDir } = require('../bin/genesis.js');

const PKG_ROOT = path.join(__dirname, '..');
const SKILLS_SRC = path.join(PKG_ROOT, '.agents', 'skills');

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

// ── Installer tests ──────────────────────────────────────────────────────────

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

// ── SKILL.md frontmatter tests ───────────────────────────────────────────────

function testSkillFrontmatter() {
  const skillDirs = fs.readdirSync(SKILLS_SRC, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith('genesis'))
    .map((e) => e.name);

  assert.ok(skillDirs.length > 0, 'nenhuma skill encontrada');

  for (const skill of skillDirs) {
    const skillFile = path.join(SKILLS_SRC, skill, 'SKILL.md');
    assert.ok(fs.existsSync(skillFile), `${skill}/SKILL.md nao existe`);

    const content = fs.readFileSync(skillFile, 'utf8');
    const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    assert.ok(frontmatter, `${skill}: frontmatter ausente ou malformado`);

    const fm = frontmatter[1];
    assert.match(fm, /^name:/m, `${skill}: campo 'name' ausente no frontmatter`);
    assert.match(fm, /^description:/m, `${skill}: campo 'description' ausente no frontmatter`);
  }
}

// ── verifySkillDir tests ─────────────────────────────────────────────────────

function testVerifyAfterInstall() {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'genesis-verify-'));
  captureOutput(() => installProject(project, false));

  const claudeIssues = verifySkillDir(path.join(project, '.claude', 'skills'));
  assert.deepEqual(claudeIssues, [], `Claude Code verify falhou: ${claudeIssues.join(', ')}`);

  const codexIssues = verifySkillDir(path.join(project, '.agents', 'skills'));
  assert.deepEqual(codexIssues, [], `Codex verify falhou: ${codexIssues.join(', ')}`);

  const opencodeIssues = verifySkillDir(path.join(project, '.opencode', 'skills'));
  assert.deepEqual(opencodeIssues, [], `OpenCode verify falhou: ${opencodeIssues.join(', ')}`);
}

function testVerifyDetectsMissingSkill() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'genesis-miss-'));
  fs.mkdirSync(path.join(dir, 'genesis'), { recursive: true });
  // genesis-architect is intentionally absent
  const issues = verifySkillDir(dir);
  assert.ok(issues.some((i) => i.includes('genesis-architect')), 'deveria detectar genesis-architect ausente');
}

function testVerifyDetectsBadFrontmatter() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'genesis-bad-'));
  const skillDirs = fs.readdirSync(SKILLS_SRC, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith('genesis'))
    .map((e) => e.name);

  for (const skill of skillDirs) {
    fs.mkdirSync(path.join(dir, skill), { recursive: true });
    if (skill === 'genesis') {
      // write a file without frontmatter
      fs.writeFileSync(path.join(dir, skill, 'SKILL.md'), 'conteudo sem frontmatter\n');
    } else {
      fs.copyFileSync(
        path.join(SKILLS_SRC, skill, 'SKILL.md'),
        path.join(dir, skill, 'SKILL.md'),
      );
    }
  }

  const issues = verifySkillDir(dir);
  assert.ok(issues.some((i) => i.includes('genesis/SKILL.md: frontmatter invalido')),
    'deveria detectar frontmatter invalido');
}

// ── validateState tests ──────────────────────────────────────────────────────

function testValidateStateEmpty() {
  const { valid } = validateState({});
  assert.ok(valid, 'objeto vazio deve ser valido (projeto recem-criado)');
}

function testValidateStateValid() {
  const { valid, errors } = validateState({
    project_name: 'Meu App',
    phase: 'sprints',
    mode: 'greenfield',
    completed_phases: ['intake', 'architecture'],
    last_updated: '2026-06-06T12:00:00Z',
  });
  assert.ok(valid, `deveria ser valido, mas retornou: ${errors.join(', ')}`);
}

function testValidateStateMissingField() {
  const { valid, errors } = validateState({
    project_name: 'App',
    phase: 'build',
    mode: 'greenfield',
    // completed_phases ausente
    last_updated: '2026-06-06T00:00:00Z',
  });
  assert.ok(!valid);
  assert.ok(errors.some((e) => e.includes('completed_phases')));
}

function testValidateStateInvalidPhase() {
  const { valid, errors } = validateState({
    project_name: 'App',
    phase: 'cooking', // invalido
    mode: 'greenfield',
    completed_phases: [],
    last_updated: '2026-06-06T00:00:00Z',
  });
  assert.ok(!valid);
  assert.ok(errors.some((e) => e.includes("phase invalido: 'cooking'")));
}

function testValidateStateInvalidMode() {
  const { valid, errors } = validateState({
    project_name: 'App',
    phase: 'intake',
    mode: 'monolith', // invalido
    completed_phases: [],
    last_updated: '2026-06-06T00:00:00Z',
  });
  assert.ok(!valid);
  assert.ok(errors.some((e) => e.includes("mode invalido: 'monolith'")));
}

function testValidateStateNotObject() {
  assert.ok(!validateState(null).valid);
  assert.ok(!validateState('string').valid);
  assert.ok(!validateState([]).valid);
}

function testValidateStateBadDate() {
  const { valid, errors } = validateState({
    project_name: 'App',
    phase: 'intake',
    mode: 'greenfield',
    completed_phases: [],
    last_updated: '06/06/2026', // formato errado
  });
  assert.ok(!valid);
  assert.ok(errors.some((e) => e.includes('last_updated')));
}

// ── Runner ───────────────────────────────────────────────────────────────────

const tests = [
  ['project install', testProjectInstall],
  ['global install', testGlobalInstall],
  ['skill frontmatter', testSkillFrontmatter],
  ['verify after install', testVerifyAfterInstall],
  ['verify detects missing skill', testVerifyDetectsMissingSkill],
  ['verify detects bad frontmatter', testVerifyDetectsBadFrontmatter],
  ['validateState empty', testValidateStateEmpty],
  ['validateState valid', testValidateStateValid],
  ['validateState missing field', testValidateStateMissingField],
  ['validateState invalid phase', testValidateStateInvalidPhase],
  ['validateState invalid mode', testValidateStateInvalidMode],
  ['validateState not object', testValidateStateNotObject],
  ['validateState bad date', testValidateStateBadDate],
];

let passed = 0;
let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`  [OK]   ${name}`);
    passed++;
  } catch (e) {
    console.error(`  [FAIL] ${name}: ${e.message}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed.`);
if (failed > 0) process.exitCode = 1;
