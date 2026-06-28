/**
 * Programmatic pi client via @earendil-works/pi-coding-agent SDK.
 * Replaces spawnSync('pi', ...) with direct in-process calls.
 *
 * Two modes:
 *   callText(prompt, model?)  — text-only, no tools, returns string
 *   callAgent(prompt, cwd)    — coding tools enabled, writes files directly
 */
import { createAgentSession, SessionManager, ModelRegistry, AuthStorage } from '@earendil-works/pi-coding-agent'

let _registry = null
async function getRegistry() {
  if (_registry) return _registry
  _registry = ModelRegistry.create(AuthStorage.create())
  return _registry
}

/**
 * Sends a single prompt to pi in text mode (no tools) and returns the response.
 * Reads auth/model config from ~/.pi/ same as the CLI.
 *
 * @param {string} prompt
 * @param {object} [opts]
 * @param {string} [opts.cwd]
 * @param {string} [opts.model] provider/model-id passed to pi (e.g. "openai/gpt-4o"); omit for pi default
 * @returns {Promise<string>}
 */
export async function callText(prompt, opts = {}) {
  const cwd = opts.cwd ?? process.cwd()
  const sessionOpts = {
    tools: [],
    sessionManager: SessionManager.inMemory(cwd),
    cwd
  }
  if (opts.model) {
    const registry = await getRegistry()
    const slashIdx = opts.model.indexOf('/')
    const provider = slashIdx >= 0 ? opts.model.slice(0, slashIdx) : null
    const modelId = slashIdx >= 0 ? opts.model.slice(slashIdx + 1) : opts.model
    const resolved = provider ? registry.find(provider, modelId) : null
    sessionOpts.modelRegistry = registry
    sessionOpts.model = resolved ?? opts.model
  }
  const { session } = await createAgentSession(sessionOpts)

  await session.prompt(prompt)

  const state = session.state
  const last = state.messages[state.messages.length - 1]
  if (!last || last.role !== 'assistant') return ''
  if (last.stopReason === 'error' || last.stopReason === 'aborted') {
    throw new Error(`pi error: ${last.errorMessage ?? last.stopReason}`)
  }
  return last.content
    .filter(c => c.type === 'text')
    .map(c => c.text)
    .join('')
}

/**
 * Sends a prompt to pi in agent mode with full coding tools (read/write/bash/edit).
 * The agent writes test files directly — no need to parse output.
 *
 * @param {string} prompt
 * @param {string} cwd project root where files should be written
 * @returns {Promise<void>}
 */
export async function callAgent(prompt, cwd) {
  const { session } = await createAgentSession({
    tools: ['read', 'write', 'edit', 'bash', 'grep', 'find', 'ls'],
    sessionManager: SessionManager.inMemory(cwd),
    cwd
  })

  await session.prompt(prompt)
}
