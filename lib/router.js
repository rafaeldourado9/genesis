'use strict';

// Tier → provider + model defaults
const TIER_DEFAULTS = {
  junior:    { provider: 'anthropic', model: 'claude-haiku' },
  pleno:     { provider: 'anthropic', model: 'claude-sonnet' },
  senior:    { provider: 'anthropic', model: 'claude-opus' },
  backend:   { provider: 'anthropic', model: 'claude-sonnet' },
  frontend:  { provider: 'anthropic', model: 'claude-sonnet' },
  qa:        { provider: 'anthropic', model: 'claude-sonnet' },
  architect: { provider: 'anthropic', model: 'claude-opus' },
  docs:      { provider: 'anthropic', model: 'claude-haiku' },
};

const SENIOR_KEYWORDS = [
  'arquitetura', 'architecture', 'design system', 'refactor', 'migration',
  'security', 'audit', 'performance', 'scalability', 'complex', 'review',
  'breaking change', 'schema change',
];

const JUNIOR_KEYWORDS = [
  'simples', 'simple', 'rename', 'typo', 'comment', 'format', 'explain',
  'quick', 'pequeno', 'small', 'trivial',
];

const DOMAIN_PATTERNS = {
  frontend:  /frontend|component|tela|page|css|react|vue|angular|ui|ux|tailwind/i,
  backend:   /backend|api|endpoint|service|repository|database|sql|migration|controller/i,
  qa:        /test|spec|coverage|qa|assert|mock|e2e|playwright|jest|pytest/i,
  architect: /arquitetura|architecture|adr|c4|system design|module|pattern|monolith|microservice/i,
  docs:      /document|readme|changelog|runbook|wiki/i,
};

function detectDomain(task) {
  for (const [domain, pattern] of Object.entries(DOMAIN_PATTERNS)) {
    if (pattern.test(task)) return domain;
  }
  return null;
}

function scoreComplexity(task) {
  const lower = task.toLowerCase();
  const words = task.split(/\s+/).length;
  const seniorHits = SENIOR_KEYWORDS.filter((k) => lower.includes(k)).length;
  const juniorHits = JUNIOR_KEYWORDS.filter((k) => lower.includes(k)).length;

  if (juniorHits > 0 && words < 25 && seniorHits === 0) return 'junior';
  if (seniorHits >= 2 || words > 120) return 'senior';
  return 'pleno';
}

function route(task, options = {}) {
  let tier = options.tier;

  if (!tier) {
    const domain = detectDomain(task);
    const complexity = scoreComplexity(task);

    // Domain takes priority; then fallback to complexity
    tier = domain || complexity;

    // Domain specialists default to pleno, but senior keywords escalate them
    if (domain && complexity === 'senior') tier = 'senior';
  }

  const defaults = TIER_DEFAULTS[tier] || TIER_DEFAULTS.pleno;

  return {
    tier,
    provider: options.provider || defaults.provider,
    model: options.model || defaults.model,
  };
}

// System prompt for each agent tier
const SYSTEM_PROMPTS = {
  junior:    'You are a junior developer. Follow instructions exactly. Write clean, minimal code. Ask if anything is unclear.',
  pleno:     'You are a mid-level developer. Balance quality, speed, and pragmatism. Make reasonable assumptions when needed.',
  senior:    'You are a senior engineer. Prioritize correctness, maintainability, and long-term consequences. Explain trade-offs.',
  backend:   'You are a backend engineer. Focus on API design, data modeling, and service reliability.',
  frontend:  'You are a frontend engineer. Focus on UX, component composition, and accessibility.',
  qa:        'You are a QA engineer. Think like a user trying to break the system. Cover happy path and edge cases.',
  architect: 'You are a software architect. Think in systems, trade-offs, and ADRs. Never implement — specify.',
  docs:      'You are a technical writer. Document the WHY, not the WHAT. Be concise and precise.',
};

function systemPrompt(tier) {
  return SYSTEM_PROMPTS[tier] || SYSTEM_PROMPTS.pleno;
}

module.exports = { route, detectDomain, scoreComplexity, systemPrompt, TIER_DEFAULTS };
