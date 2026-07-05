/**
 * Public API класифікатора: classify(survived, cwd, opts) → verdicts[]
 *
 * Routing через pi SDK (callText):
 *   1. Cache lookup → hit → використати збережений verdict.
 *   2. Cache miss → Tier 1 (N_LOCAL_MIN_MODEL через pi) → parseVerdict.
 *   3. Tier 1 fail → Tier 2 (N_CLOUD_MIN_MODEL через pi) → parseVerdict.
 *   4. Tier 2 fail → conservative fallback worth-testing/confidence=0.
 */
import { join } from 'node:path'

import { callText } from '../lib/llm.mjs'
import { CLOUD_MIN, LOCAL_MIN } from '@nitra/llm-lib/model-tiers'
import { deriveCacheKey, readCache, writeCache } from './cache.mjs'
import { buildUserPrompt, SYSTEM_PROMPT } from './prompt.mjs'
import { parseVerdict } from './verdict-schema.mjs'

const FALLBACK_VERDICT = {
  verdict: 'worth-testing',
  confidence: 0,
  reason: 'LLM-classification unavailable, conservative fallback (treat as worth-testing)'
}

/**
 * Викликає pi через callText з опційним model-id.
 * @param {string} prompt
 * @param {string} model provider/model-id або '' для pi-дефолту
 * @param {string} cwd
 * @returns {Promise<string>}
 */
function callModel(prompt, model, cwd) {
  return callText(prompt, { cwd, ...(model && { model }) })
}

/**
 * Два тири: tier1 (local-min) → tier2 (cloud-min) → FALLBACK_VERDICT.
 * @param {{file: string, mutants: object[]}} group
 * @param {object} mutant
 * @param {string} cwd
 * @param {(prompt: string, model: string, cwd: string) => Promise<string>} callModelFn
 * @param {string} tier1 model-spec першого тиру ('' = pi-дефолт)
 * @param {string} tier2 model-spec другого тиру ('' = pi-дефолт)
 * @returns {Promise<object>} verdict
 */
async function classifyOne(group, mutant, cwd, callModelFn, tier1, tier2) {
  const prompt = `${SYSTEM_PROMPT}\n\n${buildUserPrompt({ ...mutant, file: group.file }, cwd)}`
  const loc = `${group.file}:${mutant.line}:${mutant.col}`

  try {
    const text = await callModelFn(prompt, tier1, cwd)
    return parseVerdict(text)
  } catch {
    try {
      const text = await callModelFn(prompt, tier2, cwd)
      return parseVerdict(text)
    } catch (error) {
      console.warn(`⚠ coverage classify: ${loc} both tiers failed: ${error.message}`)
      return { ...FALLBACK_VERDICT }
    }
  }
}

/**
 * Класифікує survived мутантів через pi (N_LOCAL_MIN_MODEL → N_CLOUD_MIN_MODEL → fallback).
 * @param {Array<{file: string, mutants: object[], exampleTest?: object|null, recommendationText?: string|null}>} survived
 * @param {string} cwd
 * @param {{cachePath?: string, callModel?: (prompt: string, model: string, cwd: string) => Promise<string>,
 *   tier1?: string, tier2?: string}} [opts] `tier1`/`tier2` — явні model-specs (дефолт: LOCAL_MIN/CLOUD_MIN пакета;
 *   інжектовні, бо тир-константи фіксуються при імпорті й у тестах не стабляться через env)
 * @returns {Promise<Array<{key: string, verdict: object}>>}
 */
export async function classify(survived, cwd, opts = {}) {
  const cachePath = opts.cachePath ?? join(cwd, 'npm/reports/coverage-classify.cache.json')
  const callModelFn = opts.callModel ?? callModel
  const tier1 = opts.tier1 ?? LOCAL_MIN
  const tier2 = opts.tier2 ?? CLOUD_MIN
  const cacheModel = `${tier1 || 'default'}+${tier2 || 'cloud'}`

  const cache = readCache(cachePath)
  if (cache.model !== cacheModel) {
    cache.entries = {}
    cache.model = cacheModel
  }

  const verdicts = []
  for (const group of survived) {
    for (const mutant of group.mutants) {
      const lookupKey = `${group.file}:${mutant.line}:${mutant.col}:${mutant.replacement}`
      const cacheKey = deriveCacheKey(join(cwd, group.file), mutant)

      let verdict = null
      if (cacheKey && cache.entries[cacheKey]) {
        const cached = cache.entries[cacheKey]
        verdict = {
          verdict: cached.verdict,
          confidence: cached.confidence,
          reason: cached.reason,
          ...(cached.suggestedTest && { suggestedTest: cached.suggestedTest })
        }
      }
      if (!verdict) {
        verdict = await classifyOne(group, mutant, cwd, callModelFn, tier1, tier2)
        if (cacheKey) {
          cache.entries[cacheKey] = { ...verdict, classifiedAt: new Date().toISOString() }
        }
      }

      verdicts.push({ key: lookupKey, verdict })
    }
  }

  writeCache(cachePath, cache)
  return verdicts
}
