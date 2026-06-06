#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const PKG_ROOT = path.join(__dirname, '..');
const SKILLS_SRC = path.join(PKG_ROOT, '.agents', 'skills');
const PACKAGE = JSON.parse(fs.readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf8'));

const STATE_SCHEMA = {
  required: ['project_name', 'phase', 'mode', 'completed_phases', 'last_updated'],
  phases: ['intake', 'scout', 'architecture', 'data', 'contracts', 'sprints', 'build', 'qa', 'docs', 'done'],
  modes: ['greenfield', 'brownfield', 'feature-addition'],
};

function validateState(obj) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return { valid: false, errors: ['state.json deve ser um objeto JSON'] };
  }
  if (Object.keys(obj).length === 0) return { valid: true, errors: [] };

  const errors = [];
  for (const field of STATE_SCHEMA.required) {
    if (!(field in obj)) errors.push(`campo obrigatorio ausente: '${field}'`);
  }
  if (obj.phase && !STATE_SCHEMA.phases.includes(obj.phase)) {
    errors.push(`phase invalido: '${obj.phase}' — valores validos: ${STATE_SCHEMA.phases.join(', ')}`);
  }
  if (obj.mode && !STATE_SCHEMA.modes.includes(obj.mode)) {
    errors.push(`mode invalido: '${obj.mode}' — valores validos: ${STATE_SCHEMA.modes.join(', ')}`);
  }
  if (obj.completed_phases !== undefined && !Array.isArray(obj.completed_phases)) {
    errors.push("'completed_phases' deve ser um array");
  }
  if (obj.last_updated && !/^\d{4}-\d{2}-\d{2}T/.test(obj.last_updated)) {
    errors.push("'last_updated' deve estar em formato ISO 8601");
  }
  return { valid: errors.length === 0, errors };
}

const argv = process.argv.slice(2);
const cmd = argv[0] || 'help';
const force = argv.includes('--force') || argv.includes('-f');
const globalFlag = argv.includes('--global') || argv.includes('-g');

function targetArgument() {
  const optionIndex = argv.findIndex((arg) => arg === '--path' || arg === '-p');
  if (optionIndex !== -1) return argv[optionIndex + 1];
  return argv.slice(1).find((arg) => !arg.startsWith('-')) || null;
}

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function copyDirectory(source, destination, overwrite) {
  ensureDir(destination);
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destinationPath, overwrite);
    } else if (overwrite || !fs.existsSync(destinationPath)) {
      fs.copyFileSync(sourcePath, destinationPath);
    }
  }
}

function writeFile(destination, content, overwrite) {
  if (fs.existsSync(destination) && !overwrite) return false;
  ensureDir(path.dirname(destination));
  fs.writeFileSync(destination, content, 'utf8');
  return true;
}

function skills() {
  if (!fs.existsSync(SKILLS_SRC)) {
    throw new Error(`Skills nao encontradas em ${SKILLS_SRC}`);
  }
  return fs.readdirSync(SKILLS_SRC, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('genesis'))
    .map((entry) => entry.name)
    .sort();
}

function descriptionFor(skill) {
  const content = fs.readFileSync(path.join(SKILLS_SRC, skill, 'SKILL.md'), 'utf8');
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter) return `Executar o workflow ${skill}`;

  const lines = frontmatter[1].split(/\r?\n/);
  const index = lines.findIndex((line) => line.startsWith('description:'));
  if (index === -1) return `Executar o workflow ${skill}`;

  const value = lines[index].slice('description:'.length).trim();
  if (value !== '>' && value !== '|') return value.replace(/^['"]|['"]$/g, '');

  const description = [];
  for (const line of lines.slice(index + 1)) {
    if (!/^\s+/.test(line)) break;
    description.push(line.trim());
  }
  return description.join(' ') || `Executar o workflow ${skill}`;
}

function commandContent(skill, runtime) {
  const invocation = runtime === 'opencode'
    ? `Use a ferramenta nativa de skills para carregar \`${skill}\``
    : `Ative explicitamente a skill \`${skill}\``;
  return `---\ndescription: ${descriptionFor(skill)}\n---\n\n${invocation} e execute integralmente as instrucoes do SKILL.md.\n\nArgumentos adicionais do usuario: $ARGUMENTS\n`;
}

function installSkills(destinationRoot, overwrite, label) {
  console.log(`\n${label}`);
  for (const skill of skills()) {
    const destination = path.join(destinationRoot, skill);
    const existed = fs.existsSync(path.join(destination, 'SKILL.md'));
    if (existed && !overwrite) {
      console.log(`  [SKIP] ${skill}`);
      continue;
    }
    copyDirectory(path.join(SKILLS_SRC, skill), destination, true);
    console.log(`  [OK]   ${skill}`);
  }
}

function installCommands(destinationRoot, runtime, overwrite) {
  console.log(`\nComandos ${runtime}:`);
  for (const skill of skills()) {
    const destination = path.join(destinationRoot, `${skill}.md`);
    const changed = writeFile(destination, commandContent(skill, runtime), overwrite);
    console.log(`  [${changed ? 'OK' : 'SKIP'}] /${skill}`);
  }
}

const CLAUDE_MD = `# Genesis Framework\n\nGenesis esta instalado neste projeto. Use \`/genesis\` no Claude Code para iniciar ou retomar o workflow.\n\nNunca apague ou sobrescreva arquivos existentes sem confirmacao explicita.\n`;

const GITIGNORE_BLOCK = `\n# Genesis Framework runtime\n.genesis/memory/\n.genesis/state.json\n`;

function verifySkillDir(dir) {
  const issues = [];
  if (!fs.existsSync(dir)) {
    issues.push('diretorio nao encontrado');
    return issues;
  }
  for (const skill of skills()) {
    const skillFile = path.join(dir, skill, 'SKILL.md');
    if (!fs.existsSync(skillFile)) {
      issues.push(`${skill}/SKILL.md ausente`);
      continue;
    }
    const content = fs.readFileSync(skillFile, 'utf8');
    if (!content.match(/^---\r?\n[\s\S]*?\r?\n---/)) {
      issues.push(`${skill}/SKILL.md: frontmatter invalido`);
    }
  }
  return issues;
}

function verifyInstall(project) {
  const runtimes = [
    { label: 'Claude Code', dir: path.join(project, '.claude', 'skills') },
    { label: 'Codex', dir: path.join(project, '.agents', 'skills') },
    { label: 'OpenCode', dir: path.join(project, '.opencode', 'skills') },
  ];
  console.log('\nVerificando instalacao:');
  let allOk = true;
  for (const runtime of runtimes) {
    const issues = verifySkillDir(runtime.dir);
    if (issues.length === 0) {
      console.log(`  [OK]   ${runtime.label}`);
    } else {
      allOk = false;
      console.log(`  [FAIL] ${runtime.label}`);
      for (const issue of issues) console.log(`         ${issue}`);
    }
  }
  if (!allOk) throw new Error('Verificacao falhou — tente novamente com --force');
}

function verifyGlobal(home) {
  const runtimes = [
    { label: 'Claude Code', dir: path.join(home, '.claude', 'skills') },
    { label: 'Codex', dir: path.join(home, '.agents', 'skills') },
    { label: 'OpenCode', dir: path.join(home, '.config', 'opencode', 'skills') },
  ];
  console.log('\nVerificando instalacao global:');
  let allOk = true;
  for (const runtime of runtimes) {
    const issues = verifySkillDir(runtime.dir);
    if (issues.length === 0) {
      console.log(`  [OK]   ${runtime.label}`);
    } else {
      allOk = false;
      console.log(`  [FAIL] ${runtime.label}`);
      for (const issue of issues) console.log(`         ${issue}`);
    }
  }
  if (!allOk) throw new Error('Verificacao global falhou — tente novamente com --force');
}

function installProject(target, overwrite) {
  const project = path.resolve(target);
  if (!fs.existsSync(project) || !fs.statSync(project).isDirectory()) {
    throw new Error(`Diretorio nao encontrado: ${project}`);
  }

  console.log(`\nGenesis Framework ${PACKAGE.version}`);
  console.log(`Instalando integracoes em ${project}`);

  installSkills(path.join(project, '.agents', 'skills'), overwrite, 'Codex / Agent Skills:');
  installSkills(path.join(project, '.claude', 'skills'), overwrite, 'Claude Code:');
  installSkills(path.join(project, '.opencode', 'skills'), overwrite, 'OpenCode:');
  installCommands(path.join(project, '.opencode', 'commands'), 'opencode', overwrite);

  const templates = path.join(PKG_ROOT, 'templates');
  if (fs.existsSync(templates)) {
    copyDirectory(templates, path.join(project, '.genesis', 'templates'), overwrite);
  }

  writeFile(path.join(project, 'CLAUDE.md'), CLAUDE_MD, false);
  writeFile(path.join(project, '.genesis', 'state.json'), '{}\n', false);

  const gitignore = path.join(project, '.gitignore');
  if (fs.existsSync(gitignore)) {
    const current = fs.readFileSync(gitignore, 'utf8');
    if (!current.includes('.genesis/memory/')) fs.appendFileSync(gitignore, GITIGNORE_BLOCK);
  }

  verifyInstall(project);
  console.log('\nInstalacao concluida.');
  console.log('  Claude Code: /genesis');
  console.log('  OpenCode:    /genesis');
  console.log('  Codex:       $genesis (ou /skills e selecione genesis)');
}

function installGlobal(overwrite, home = os.homedir()) {
  console.log(`\nGenesis Framework ${PACKAGE.version} - instalacao global`);

  installSkills(path.join(home, '.agents', 'skills'), overwrite, 'Codex / Agent Skills:');
  installSkills(path.join(home, '.claude', 'skills'), overwrite, 'Claude Code:');
  installSkills(path.join(home, '.config', 'opencode', 'skills'), overwrite, 'OpenCode:');
  installCommands(path.join(home, '.config', 'opencode', 'commands'), 'opencode', overwrite);

  // Codex custom prompts are deprecated, but this keeps slash-menu access for users
  // who prefer it. Native Codex skill invocation remains $genesis or /skills.
  installCommands(path.join(home, '.codex', 'prompts'), 'codex', overwrite);

  verifyGlobal(home);
  console.log('\nInstalacao global concluida. Reinicie sessoes abertas dos agentes.');
  console.log('  Claude Code: /genesis');
  console.log('  OpenCode:    /genesis');
  console.log('  Codex:       $genesis ou /prompts:genesis');
}

function help() {
  console.log(`\nGenesis Framework ${PACKAGE.version}\n`);
  console.log('Uso:');
  console.log('  genesis init [diretorio] [--force]');
  console.log('  genesis global [--force]');
  console.log('  genesis update [diretorio] [--global]');
  console.log('  genesis verify [diretorio]');
  console.log('  genesis validate-state [diretorio]');
  console.log('');
  console.log('O instalador ativa automaticamente Claude Code, Codex e OpenCode.');
}

function main() {
  try {
    switch (cmd) {
      case 'init':
      case 'install':
      case 'i':
        if (globalFlag) installGlobal(force);
        else installProject(targetArgument() || '.', force);
        break;
      case 'global':
      case 'g':
        installGlobal(force);
        break;
      case 'update':
      case 'upgrade':
      case 'u':
        if (globalFlag) installGlobal(true);
        else installProject(targetArgument() || '.', true);
        break;
      case 'verify':
      case 'check': {
        const project = path.resolve(targetArgument() || '.');
        verifyInstall(project);
        console.log('\nTudo OK.');
        break;
      }
      case 'validate-state': {
        const project = path.resolve(targetArgument() || '.');
        const stateFile = path.join(project, '.genesis', 'state.json');
        if (!fs.existsSync(stateFile)) {
          console.error(`state.json nao encontrado em ${stateFile}`);
          process.exitCode = 1;
          break;
        }
        let parsed;
        try {
          parsed = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        } catch (e) {
          console.error(`state.json invalido: ${e.message}`);
          process.exitCode = 1;
          break;
        }
        const result = validateState(parsed);
        if (result.valid) {
          console.log('state.json valido.');
        } else {
          console.error('state.json invalido:');
          for (const err of result.errors) console.error(`  - ${err}`);
          process.exitCode = 1;
        }
        break;
      }
      case 'help':
      case '--help':
      case '-h':
        help();
        break;
      default:
        help();
        process.exitCode = 1;
    }
  } catch (error) {
    console.error(`\nErro: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = { installGlobal, installProject, validateState, verifySkillDir };
