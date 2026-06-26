import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  MAX_MSG_CHARS,
  ROTATE_BYTES,
  tracePath,
  capMessages,
  buildTraceRecord,
  rotateIfNeeded,
  writeTrace
} from './omlx-trace.mjs'

vi.mock('node:fs', () => ({
  appendFileSync: vi.fn(),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  renameSync: vi.fn(),
  statSync: vi.fn()
}))

vi.mock('node:crypto', () => ({
  createHash: () => ({
    update: vi.fn().mockReturnThis(),
    digest: vi.fn().mockReturnValue('mocked_hash')
  })
}))

vi.mock('node:path', () => ({
  join: vi.fn((...args) => args.join('/')),
  dirname: vi.fn(p => p.replace(/\\/g, '/').split('/').slice(0, -1).join('/'))
}))

describe('omlx-trace.mjs', () => {
  describe('tracePath', () => {
    const origTrace = process.env.N_CURSOR_LLM_TRACE

    beforeEach(() => {
      delete process.env.N_CURSOR_LLM_TRACE
    })

    afterEach(() => {
      if (origTrace !== undefined) process.env.N_CURSOR_LLM_TRACE = origTrace
      else delete process.env.N_CURSOR_LLM_TRACE
    })

    it('should return null when N_CURSOR_LLM_TRACE is set to a kill value', () => {
      process.env.N_CURSOR_LLM_TRACE = 'off'
      expect(tracePath()).toBeNull()
    })

    it('should return the specified path when N_CURSOR_LLM_TRACE is a custom path', () => {
      process.env.N_CURSOR_LLM_TRACE = '/custom/trace.jsonl'
      expect(tracePath()).toBe('/custom/trace.jsonl')
    })
  })

  describe('capMessages', () => {
    it('should return original messages and correct hash if no truncation occurs', () => {
      const messages = [
        { role: 'user', content: 'short message' },
        { role: 'assistant', content: 'another short response' }
      ]
      const { messages: capped, messages_sha256, messages_truncated } = capMessages(messages)

      expect(capped).toEqual(messages)
      expect(messages_truncated).toBe(false)
      expect(messages_sha256).toBe('mocked_hash')
    })

    it('should truncate messages exceeding MAX_MSG_CHARS and set truncated flag', () => {
      const longContent = 'A'.repeat(MAX_MSG_CHARS + 1)
      const messages = [{ role: 'user', content: longContent }]
      const { messages: capped, messages_sha256, messages_truncated } = capMessages(messages)

      expect(messages_truncated).toBe(true)
      expect(capped[0].content.length).toBe(MAX_MSG_CHARS)
      expect(messages_sha256).toBe('mocked_hash')
    })

    it('should handle null or undefined input messages gracefully', () => {
      const { messages: capped, messages_sha256, messages_truncated } = capMessages(null)
      expect(capped).toEqual([])
      expect(messages_sha256).toBe('mocked_hash')
      expect(messages_truncated).toBe(false)
    })
  })

  describe('buildTraceRecord', () => {
    const mockInput = {
      ts: '2026-06-26T10:00:00Z',
      caller: 'fix',
      backend: 'omlx',
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 4096,
      messages: [{ role: 'user', content: 'test' }],
      content: 'response content',
      reasoning: 'Model thought',
      reasoningSource: 'strategy',
      finishReason: 'stop',
      usage: { input_tokens: 10, output_tokens: 20 },
      ms: 150,
      attempts: 1,
      ok: true,
      error: null
    }

    it('should correctly build the record when all fields are present', () => {
      const record = buildTraceRecord(mockInput)
      expect(record.ts).toBe(mockInput.ts)
      expect(record.caller).toBe(mockInput.caller)
      expect(record.model).toBe(mockInput.model)
      expect(record.messages_sha256).toBe('mocked_hash')
      expect(record.content).toBe('response content')
      expect(record.ms).toBe(150)
    })

    it('should handle missing optional fields by setting them to null', () => {
      const minimalInput = {
        ts: '2026-06-26T10:01:00Z',
        caller: 'unknown',
        backend: 'pi',
        model: 'claude-3',
        messages: [{ role: 'user', content: 'simple' }],
        ms: 50,
        ok: false
      }
      const record = buildTraceRecord(minimalInput)

      expect(record.temperature).toBeNull()
      expect(record.max_tokens).toBeNull()
      expect(record.content).toBeNull()
      expect(record.reasoning).toBeNull()
      expect(record.attempts).toBeNull()
      expect(record.error).toBeNull()
    })
  })
})
