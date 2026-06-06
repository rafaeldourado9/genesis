#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');

const vault = require('../lib/vault');
const llm = require('../lib/llm');
const router = require('../lib/router');
const cache = require('../lib/cache');
const coalesce = require('../lib/coalesce');
const tokens = require('../lib/tokens');
const progress = require('../lib/progress');

const PKG = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

const argv = process.argv.slice(2);
const [cmd, ...args] = argv;

// ── Helpers ──────────────────────────────────────────────────────────────────

function flag(name) {
  const long = `--${name}`;
  const idx = argv.indexOf(long);
  if (idx !== -1) return argv[idx + 1];
  return null;
}

function hasFlag(name) {
  return argv.includes(`--${name}`);
}

function positional(afterCmd = 1) {
  return argv.slice(afterCmd).filter((a) => !a.startsWith('--'));
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (a) => { rl.close(); resolve(a.trim()); }));
}

function print(...lines) { console.log(lines.join('\n')); }
function err(...lines) { console.error(lines.join('\n')); }

// Resolve API key: env → vault
async function resolveKey(envName, vaultName) {
  const val = await vault.getOrEnv(envName) || await vault.getOrEnv(vaultName);
  if (!val) throw new Error(
    `Chave nao encontrada: ${envName}. Execute: genesis-run setup`,
  );
  return val;
}

async function apiKeyFor(provider) {
  switch (provider) {
    case 'anthropic':
    case 'claude':
      return resolveKey('ANTHROPIC_API_KEY', 'ANTHROPIC_API_KEY');
    case 'openai':
      return resolveKey('OPENAI_API_KEY', 'OPENAI_API_KEY');
    case 'gemini':
    case 'google':
      return resolveKey('GEMINI_API_KEY', 'GEMINI_API_KEY');
    default:
      throw new Error(`Provider desconhecido: ${provider}`);
  }
}

// ── Commands ─────────────────────────────────────────────────────────────────

async function cmdSetup() {
  print(`\nGenesis Run ${PKG.version} — Setup\n`);
  print('Configure suas chaves de API. Pressione Enter para pular um provider.\n');

  const providers = [
    { name: 'Anthropic (Claude)', envKey: 'ANTHROPIC_API_KEY', hint: 'sk-ant-...' },
    { name: 'OpenAI', envKey: 'OPENAI_API_KEY', hint: 'sk-...' },
    { name: 'Google Gemini', envKey: 'GEMINI_API_KEY', hint: 'AIza...' },
    { name: 'Provider 4 (nome:NOME_DA_CHAVE)', envKey: null, hint: '' },
    { name: 'Provider 5 (nome:NOME_DA_CHAVE)', envKey: null, hint: '' },
  ];

  for (const p of providers) {
    let envKey = p.envKey;
    if (!envKey) {
      const input = await ask(`${p.name}: `);
      if (!input || !input.includes(':')) continue;
      const [, keyName] = input.split(':');
      envKey = keyName.trim();
      const value = await ask(`  Valor da chave ${envKey}: `);
      if (!value) continue;
      await vault.set(envKey, value);
      print(`  [OK] ${envKey} salva no vault`);
      continue;
    }

    const value = await ask(`${p.name} ${p.hint ? `(${p.hint})` : ''}: `);
    if (!value) { print(`  [SKIP] ${envKey}`); continue; }
    await vault.set(envKey, value);
    print(`  [OK] ${envKey} salva no vault`);
  }

  const budget = await ask('\nBudget de tokens por sessao [500000]: ');
  if (budget && !isNaN(Number(budget))) {
    tokens.setBudget(Number(budget));
    print(`  [OK] Budget: ${Number(budget).toLocaleString()} tokens/sessao`);
  }

  print('\nSetup concluido. Execute: genesis-run run "sua tarefa"');
}

async function cmdKeys() {
  const sub = args[0];

  if (sub === 'list' || !sub) {
    const keys = vault.list();
    if (keys.length === 0) { print('Nenhuma chave salva. Execute: genesis-run setup'); return; }
    print('\nChaves no vault:');
    for (const k of keys) print(`  ${k}`);
    return;
  }

  if (sub === 'set') {
    const [, name, ...valueParts] = args;
    if (!name) { err('Uso: genesis-run keys set NOME valor'); process.exitCode = 1; return; }
    const value = valueParts.join(' ') || await ask(`Valor para ${name}: `);
    await vault.set(name, value);
    print(`[OK] ${name} salva`);
    return;
  }

  if (sub === 'delete' || sub === 'remove') {
    const [, name] = args;
    if (!name) { err('Uso: genesis-run keys delete NOME'); process.exitCode = 1; return; }
    await vault.remove(name);
    print(`[OK] ${name} removida`);
    return;
  }

  err(`Subcomando desconhecido: ${sub}. Use: list, set, delete`);
  process.exitCode = 1;
}

async function cmdRun() {
  const task = positional().join(' ');
  if (!task) { err('Uso: genesis-run run "descricao da tarefa" [--tier junior|pleno|senior] [--provider claude|openai|gemini] [--no-cache]'); process.exitCode = 1; return; }

  const tierOpt = flag('tier');
  const providerOpt = flag('provider');
  const modelOpt = flag('model');
  const noCache = hasFlag('no-cache');
  const label = flag('label') || task.slice(0, 50);

  const route = router.route(task, { tier: tierOpt, provider: providerOpt, model: modelOpt });
  const system = router.systemPrompt(route.tier);
  const messages = [{ role: 'user', content: task }];

  print(`\n→ Roteando: tier=${route.tier}  provider=${route.provider}  model=${route.model}`);

  // Check cache first
  if (!noCache) {
    const cached = cache.get(route.provider, route.model, messages);
    if (cached) {
      print('[CACHE HIT]\n');
      print(cached.content);
      print(`\n[tokens salvos: ~${(cached.tokens?.input || 0) + (cached.tokens?.output || 0)} tokens]`);
      return;
    }
  }

  const apiKey = await apiKeyFor(route.provider);

  const result = await llm.call({ provider: route.provider, model: route.model, messages, system, apiKey });

  // Track tokens
  tokens.track(route.provider, route.model, result.tokens, label);

  // Cache response
  if (!noCache) cache.set(route.provider, route.model, messages, result);

  // Update progress
  progress.append({
    task: label,
    status: 'done',
    agent: route.tier,
    tokens: (result.tokens.input || 0) + (result.tokens.output || 0),
  });

  print('\n' + result.content);
  print(`\n[tokens: in=${result.tokens.input} out=${result.tokens.output} cache_read=${result.tokens.cache_read || 0}]`);
}

async function cmdParallel() {
  const task = positional().join(' ');
  if (!task) { err('Uso: genesis-run parallel "tarefa" --providers claude,openai'); process.exitCode = 1; return; }

  const providersArg = flag('providers') || 'anthropic';
  const providerList = providersArg.split(',').map((p) => p.trim());
  const tierOpt = flag('tier');

  print(`\n→ Rodando em ${providerList.length} provider(s): ${providerList.join(', ')}`);

  const requests = await Promise.all(providerList.map(async (provider) => {
    const route = router.route(task, { tier: tierOpt, provider });
    const system = router.systemPrompt(route.tier);
    return {
      provider: route.provider,
      model: route.model,
      messages: [{ role: 'user', content: task }],
      system,
      apiKey: await apiKeyFor(route.provider),
    };
  }));

  const results = await llm.parallel(requests);

  results.forEach((r, i) => {
    tokens.track(r.provider, r.model, r.tokens, task.slice(0, 40));
    print(`\n─── ${providerList[i]} (${r.model}) ───\n`);
    print(r.content);
    print(`[tokens: in=${r.tokens.input} out=${r.tokens.output}]`);
  });

  progress.append({
    task: task.slice(0, 50),
    status: 'done',
    agent: `parallel(${providerList.join(',')})`,
    tokens: results.reduce((s, r) => s + (r.tokens.input || 0) + (r.tokens.output || 0), 0),
  });
}

async function cmdStatus() {
  print(tokens.summary());
  const cacheInfo = cache.stats();
  print(`\nCache: ${cacheInfo.entries} entradas  ${cacheInfo.sizeKb} KB`);
  const prog = progress.read();
  if (prog) {
    const pending = progress.pendingTasks();
    print(`\nTasks pendentes: ${pending.length}`);
    if (pending.length > 0) pending.forEach((t) => print(`  ⬜ ${t}`));
  }
}

async function cmdCache() {
  const sub = args[0];
  if (sub === 'clear') {
    const n = cache.clear();
    print(`Cache limpo: ${n} entradas removidas`);
  } else if (sub === 'stats' || !sub) {
    const s = cache.stats();
    print(`Cache: ${s.entries} entradas  ${s.sizeKb} KB`);
  } else {
    err(`Subcomando: clear | stats`);
  }
}

async function cmdBudget() {
  const sub = args[0];
  if (sub === 'set') {
    const n = Number(args[1]);
    if (!n) { err('Uso: genesis-run budget set <numero>'); process.exitCode = 1; return; }
    tokens.setBudget(n);
    print(`Budget definido: ${n.toLocaleString()} tokens/sessao`);
  } else if (sub === 'reset') {
    tokens.reset();
    print('Sessao de tokens reiniciada');
  } else {
    print(tokens.summary());
  }
}

function cmdHelp() {
  print(`
Genesis Run ${PKG.version} — Orquestrador de agentes com multi-LLM

Uso:
  genesis-run setup                         Configurar chaves e budget
  genesis-run keys list|set|delete          Gerenciar chaves no vault
  genesis-run run "tarefa" [opcoes]         Executar tarefa com agente otimo
  genesis-run parallel "tarefa" --providers claude,openai
  genesis-run status                        Tokens usados + tasks pendentes
  genesis-run cache clear|stats             Gerenciar cache
  genesis-run budget set <n> | reset        Gerenciar budget de tokens

Opcoes de run:
  --tier   junior|pleno|senior|backend|frontend|qa|architect
  --provider  anthropic|openai|gemini
  --model  claude-sonnet|gpt|gemini-flash|...
  --no-cache  Ignorar cache para esta chamada
  --label  "nome da task" (para progress.md)

Seguranca:
  Chaves ficam em ~/.genesis/vault.json (AES-256-GCM, PBKDF2 100k iter).
  Use GENESIS_VAULT_PASSPHRASE para ambientes CI/CD.
  Variaveis de ambiente sempre tem prioridade sobre o vault.
`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  coalesce.init(llm.call);

  try {
    switch (cmd) {
      case 'setup':       await cmdSetup(); break;
      case 'keys':        await cmdKeys(); break;
      case 'run':         await cmdRun(); break;
      case 'parallel':    await cmdParallel(); break;
      case 'status':      await cmdStatus(); break;
      case 'cache':       await cmdCache(); break;
      case 'budget':      await cmdBudget(); break;
      case 'help':
      case '--help':
      case '-h':
      case undefined:     cmdHelp(); break;
      default:
        err(`Comando desconhecido: ${cmd}. Use: genesis-run --help`);
        process.exitCode = 1;
    }
  } catch (e) {
    err(`\nErro: ${e.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = { cmdRun, cmdParallel, cmdStatus };
