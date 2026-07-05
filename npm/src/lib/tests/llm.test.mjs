/**
 * Тести адаптера llm.mjs: контракт callText (string-повернення, throw на error,
 * одноразове подвоєння maxTokens на stopReason:'length'). Транспорт пакета не
 * чіпається — фейк-сесія інжектується через deps (прокидається у runOneShot).
 */
import { describe, expect, it, vi } from 'vitest'
import { callText, MEMORY_ERROR_RE } from '../llm.mjs'

const registry = { find: (p, id) => ({ provider: p, id }) }

/**
 * Fake AgentSession для runOneShot: емітить текст і stopReason.
 * @param {{ text?: string, stopReason?: string|null, promptError?: string|null }} [opts] параметри фейку
 * @returns {object} fake AgentSession
 */
function fakeSession({ text = 'ok', stopReason = null, promptError = null } = {}) {
  let cb = () => null
  return {
    subscribe: fn => {
      cb = fn
    },
    prompt() {
      return (async () => {
        cb({ type: 'message_update', assistantMessageEvent: { type: 'text_delta', delta: text } })
        cb({ type: 'message_end', message: { usage: { totalTokens: 1 }, stopReason } })
        if (promptError) throw new Error(promptError)
      })()
    }
  }
}

/**
 * deps для runOneShot: registry + trace-стаб + фабрика фейк-сесій (по одній на виклик).
 * @param {object[]} sessions фейк-сесії у порядку викликів
 * @returns {{ deps: object, createSession: import('vitest').Mock }} deps і шпигун фабрики
 */
function depsFor(sessions) {
  let i = 0
  const createSession = vi.fn(() => Promise.resolve(sessions[Math.min(i++, sessions.length - 1)]))
  return { deps: { registry, trace: vi.fn(), createSession }, createSession }
}

describe('callText', () => {
  it('повертає текст відповіді', async () => {
    const { deps } = depsFor([fakeSession({ text: 'відповідь' })])
    await expect(callText('q', { model: 'omlx/x', deps })).resolves.toBe('відповідь')
  })

  it('кидає Error на помилці виклику (fail-fast, без retry)', async () => {
    const { deps, createSession } = depsFor([fakeSession({ promptError: 'boom' })])
    await expect(callText('q', { model: 'omlx/x', deps })).rejects.toThrow('boom')
    expect(createSession).toHaveBeenCalledTimes(1)
  })

  it("stopReason 'length' → один повтор із подвоєним maxTokens", async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => null)
    try {
      const { deps, createSession } = depsFor([
        fakeSession({ text: 'обріз', stopReason: 'length' }),
        fakeSession({ text: 'повна' })
      ])
      const r = await callText('q', { model: 'omlx/x', maxTokens: 2048, deps })
      expect(r).toBe('повна')
      expect(createSession).toHaveBeenNthCalledWith(1, expect.objectContaining({ maxTokens: 2048 }))
      expect(createSession).toHaveBeenNthCalledWith(2, expect.objectContaining({ maxTokens: 4096 }))
    } finally {
      logSpy.mockRestore()
    }
  })

  it("подвоєння лише один раз: другий 'length' повертає обрізаний текст", async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => null)
    try {
      const { deps, createSession } = depsFor([fakeSession({ text: 'обріз', stopReason: 'length' })])
      const r = await callText('q', { model: 'omlx/x', maxTokens: 2048, deps })
      expect(r).toBe('обріз')
      expect(createSession).toHaveBeenCalledTimes(2)
    } finally {
      logSpy.mockRestore()
    }
  })
})

describe('MEMORY_ERROR_RE', () => {
  it('класифікує memory-guard помилки пакета', () => {
    expect(MEMORY_ERROR_RE.test('omlx memory-guard: prefill would require 12GB')).toBe(true)
    expect(MEMORY_ERROR_RE.test('ECONNREFUSED')).toBe(false)
  })
})
