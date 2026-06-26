import { vi, describe, it, expect, beforeEach } from "vitest"
import { resolveOmlxApiKey, isOmlxModel, omlxModelId, extractReasoning, callOmlxRaw, callOmlx, DEFAULT_OMLX_URL } from "./omlx.mjs"
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

vi.mock('node:child_process', () => ({ spawnSync: vi.fn() }))
vi.mock('node:os', () => ({ homedir: () => '/mock/home' }))
vi.mock('node:path', () => ({ join: vi.fn((...args) => args.join('/')) }))
vi.mock('node:fs', () => ({ readFileSync: vi.fn() }))

describe('omlx.mjs utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.N_CURSOR_OMLX_KEY
  })

  describe('resolveOmlxApiKey', () => {
    it('should return the explicit apiKey if provided', () => {
      expect(resolveOmlxApiKey('explicit_key')).toBe('explicit_key')
    })

    it('should return the environment variable key if present and explicit key is null', () => {
      process.env.N_CURSOR_OMLX_KEY = 'env_key'
      expect(resolveOmlxApiKey(null)).toBe('env_key')
    })

    it('should return the API key from ~/.omlx/settings.json if env/explicit key is missing', () => {
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ auth: { api_key: 'settings_key' } }))
      expect(resolveOmlxApiKey(undefined)).toBe('settings_key')
    })

    it('should return null if settings.json lacks auth.api_key', () => {
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ auth: {} }))
      expect(resolveOmlxApiKey(undefined)).toBe(null)
    })

    it('should return null if reading settings.json fails', () => {
      vi.mocked(readFileSync).mockImplementation(() => {
        throw new Error('File not found')
      })
      expect(resolveOmlxApiKey(undefined)).toBe(null)
    })
  })

  describe('isOmlxModel', () => {
    it("should return true for models starting with 'omlx/'", () => {
      expect(isOmlxModel('omlx/gemma-4-e2b-it-4bit')).toBe(true)
    })

    it("should return false for models not starting with 'omlx/'", () => {
      expect(isOmlxModel('gpt-4')).toBe(false)
    })

    it('should return false for non-string inputs', () => {
      expect(isOmlxModel(null)).toBe(false)
      expect(isOmlxModel(123)).toBe(false)
      expect(isOmlxModel({})).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isOmlxModel('')).toBe(false)
    })
  })

  describe('omlxModelId', () => {
    it("should remove the 'omlx/' prefix from omlx models", () => {
      expect(omlxModelId('omlx/gemma-4-e2b-it-4bit')).toBe('gemma-4-e2b-it-4bit')
    })

    it('should return the original model ID if it does not have the prefix', () => {
      expect(omlxModelId('gpt-4-turbo')).toBe('gpt-4-turbo')
    })

    it("should return original model ID if it's empty", () => {
      expect(omlxModelId('')).toBe('')
    })
  })

  describe('extractReasoning', () => {
    it('should extract reasoning from the reasoning_content field', () => {
      const message = { reasoning_content: 'My detailed thought process.', content: 'Response content' }
      const { reasoning, reasoningSource } = extractReasoning(message, null)
      expect(reasoning).toBe('My detailed thought process.')
      expect(reasoningSource).toBe('field')
    })

    it('should extract reasoning from think tag within content', () => {
      const thinkOpen = '\x3c' + 'think\x3e'
      const thinkClose = '\x3c' + '/think\x3e'
      const message = { content: 'Before: ' + thinkOpen + 'My thought process.' + thinkClose + ' After.' }
      const { reasoning, reasoningSource } = extractReasoning(message, null)
      expect(reasoning).toBe('My thought process.')
      expect(reasoningSource).toBe('think_tag')
    })

    it('should treat content as reasoning if finish_reason is "length" and no other reasoning is present', () => {
      const message = { content: 'This was truncated during generation.' }
      const { reasoning, reasoningSource } = extractReasoning(message, 'length')
      expect(reasoning).toBe('This was truncated during generation.')
      expect(reasoningSource).toBe('truncated')
    })

    it('should return null for reasoning if no indicators are found', () => {
      const message = { content: 'Just a standard response.' }
      const { reasoning, reasoningSource } = extractReasoning(message, null)
      expect(reasoning).toBeNull()
      expect(reasoningSource).toBeNull()
    })

    it('should return null for reasoning if message is null/empty', () => {
      const { reasoning, reasoningSource } = extractReasoning({}, null)
      expect(reasoning).toBeNull()
      expect(reasoningSource).toBeNull()
    })

    it('should handle empty content gracefully for truncated reasoning', () => {
        const message = { content: '' }
        const { reasoning, reasoningSource } = extractReasoning(message, 'length')
        expect(reasoning).toBeNull()
        expect(reasoningSource).toBeNull()
      })
  })

  describe('callOmlxRaw', () => {
    const messages = [{ role: 'user', content: 'Hello' }]
    const model = 'omlx/test-model'

    it('should throw if model is empty and no fallback', () => {
      expect(() => callOmlxRaw(messages, '', {})).toThrow(/модель не задано/)
    })

    it('should return parsed response on success', () => {
      const mockResponse = { choices: [{ message: { content: 'Hi there' }, finish_reason: 'stop' }], usage: null }
      vi.mocked(spawnSync).mockReturnValue({ status: 0, stdout: JSON.stringify(mockResponse), error: null })
      const result = callOmlxRaw(messages, model)
      expect(result.content).toBe('Hi there')
      expect(result.finishReason).toBe('stop')
      expect(result.attempts).toBe(1)
    })

    it('should throw on non-zero curl exit code (non-transient)', () => {
      vi.mocked(spawnSync).mockReturnValue({ status: 1, stdout: '', stderr: 'error', error: null })
      expect(() => callOmlxRaw(messages, model)).toThrow(/omlx curl exit 1/)
    })

    it('should throw on bad JSON response', () => {
      vi.mocked(spawnSync).mockReturnValue({ status: 0, stdout: 'not-json', error: null })
      expect(() => callOmlxRaw(messages, model)).toThrow(/omlx bad json/)
    })

    it('should throw on empty content in response', () => {
      const mockResponse = { choices: [{ message: { content: '  ' }, finish_reason: 'stop' }] }
      vi.mocked(spawnSync).mockReturnValue({ status: 0, stdout: JSON.stringify(mockResponse), error: null })
      expect(() => callOmlxRaw(messages, model)).toThrow(/omlx empty content/)
    })

    it('should throw on api error field in response', () => {
      const mockResponse = { error: { message: 'Auth failed' } }
      vi.mocked(spawnSync).mockReturnValue({ status: 0, stdout: JSON.stringify(mockResponse), error: null })
      expect(() => callOmlxRaw(messages, model)).toThrow(/omlx api/)
    })

    it('should throw on spawnSync error after retries', () => {
      vi.mocked(spawnSync).mockReturnValue({ status: 0, error: { message: 'ETIMEDOUT', code: 'ETIMEDOUT' } })
      expect(() => callOmlxRaw(messages, model, { backoffMs: [0, 0] })).toThrow()
    })

    it('should retry on transient curl exit code and succeed', () => {
      const mockResponse = { choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }], usage: null }
      vi.mocked(spawnSync)
        .mockReturnValueOnce({ status: 28, stdout: '', stderr: '', error: null })
        .mockReturnValueOnce({ status: 0, stdout: JSON.stringify(mockResponse), error: null })
      const result = callOmlxRaw(messages, model, { backoffMs: [0, 0] })
      expect(result.content).toBe('ok')
    })
  })

  describe('callOmlx', () => {
    const messages = [{ role: 'user', content: 'Hello' }]
    const model = 'omlx/test-model'

    it('should return content string from callOmlxRaw', () => {
      const mockResponse = { choices: [{ message: { content: 'Just text' }, finish_reason: 'stop' }], usage: null }
      vi.mocked(spawnSync).mockReturnValue({ status: 0, stdout: JSON.stringify(mockResponse), error: null })
      expect(callOmlx(messages, model)).toBe('Just text')
    })
  })

})
