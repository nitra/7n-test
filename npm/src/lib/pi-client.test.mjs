import { vi, describe, it, expect, beforeEach } from 'vitest'
import { setTimeout as sleep } from 'node:timers/promises'
import { callText, callAgent } from './pi-client.mjs'

// vi.hoisted: vi.mock піднімається на початок файлу, тож звичайний top-level
// const ще не ініціалізований, коли factory виконується під час імпорту SUT
const mockCreateAgentSession = vi.hoisted(() => vi.fn())

// Mock the entire pi-coding-agent SDK
vi.mock('@earendil-works/pi-coding-agent', () => ({
  createAgentSession: mockCreateAgentSession,
  SessionManager: {
    inMemory: vi.fn().mockReturnValue({ type: 'inMemory' })
  }
}))

// Skip actual backoff delays so retry tests run instantly
vi.mock('node:timers/promises', () => ({ setTimeout: vi.fn().mockResolvedValue() }))

describe('pi-client.mjs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('callText', () => {
    it('should call createAgentSession with correct parameters and return assistant content on success', async () => {
      const mockSession = {
        prompt: vi.fn().mockResolvedValue(),
        dispose: vi.fn(),
        state: {
          messages: [
            {
              role: 'user',
              content: [{ type: 'text', text: 'Hello' }]
            },
            {
              role: 'assistant',
              content: [{ type: 'text', text: 'World' }]
            }
          ],
          stopReason: null
        }
      }
      mockCreateAgentSession.mockResolvedValue({ session: mockSession })

      const prompt = 'What is the time?'
      const result = await callText(prompt)

      expect(mockCreateAgentSession).toHaveBeenCalledWith({
        tools: [],
        sessionManager: expect.any(Object), // Checks SessionManager.inMemory call internally
        cwd: expect.any(String) // Checks process.cwd() behavior when opts.cwd is missing
      })
      expect(mockSession.prompt).toHaveBeenCalledWith(prompt)
      expect(result).toBe('World')
    })

    it('should return an empty string if the last message role is not assistant', async () => {
      const mockSession = {
        prompt: vi.fn().mockResolvedValue(),
        dispose: vi.fn(),
        state: {
          messages: [
            {
              role: 'user',
              content: [{ type: 'text', text: 'Hello' }]
            },
            {
              role: 'user', // Unexpected role
              content: [{ type: 'text', text: 'More hello' }]
            }
          ],
          stopReason: null
        }
      }
      mockCreateAgentSession.mockResolvedValue({ session: mockSession })

      const result = await callText('Test')
      expect(result).toBe('')
    })

    it('should throw an error if pi stops with an error reason', async () => {
      const mockSession = {
        prompt: vi.fn().mockResolvedValue(),
        dispose: vi.fn(),
        state: {
          messages: [
            {
              role: 'user',
              content: [{ type: 'text', text: 'Hello' }]
            },
            {
              role: 'assistant',
              stopReason: 'error',
              errorMessage: 'Authentication failed',
              content: [{ type: 'text', text: 'Error response' }]
            }
          ]
        }
      }
      mockCreateAgentSession.mockResolvedValue({ session: mockSession })

      await expect(callText('Test')).rejects.toThrow('pi error: Authentication failed')
    })

    it('should throw an error if pi stops with an aborted reason', async () => {
      const mockSession = {
        prompt: vi.fn().mockResolvedValue(),
        dispose: vi.fn(),
        state: {
          messages: [
            {
              role: 'user',
              content: [{ type: 'text', text: 'Hello' }]
            },
            {
              role: 'assistant',
              stopReason: 'aborted',
              errorMessage: null,
              content: [{ type: 'text', text: 'Aborted response' }]
            }
          ]
        }
      }
      mockCreateAgentSession.mockResolvedValue({ session: mockSession })

      await expect(callText('Test')).rejects.toThrow('pi error: aborted')
    })

    it('disposes the session on success and even when prompt throws', async () => {
      const okSession = {
        prompt: vi.fn().mockResolvedValue(),
        dispose: vi.fn(),
        state: { messages: [{ role: 'assistant', content: [{ type: 'text', text: 'OK' }] }] }
      }
      mockCreateAgentSession.mockResolvedValue({ session: okSession })
      await callText('Test')
      expect(okSession.dispose).toHaveBeenCalledTimes(1)

      const failSession = {
        prompt: vi.fn().mockRejectedValue(new Error('Authentication failed')),
        dispose: vi.fn(),
        state: { messages: [] }
      }
      mockCreateAgentSession.mockResolvedValue({ session: failSession })
      await expect(callText('Test')).rejects.toThrow('Authentication failed')
      expect(failSession.dispose).toHaveBeenCalledTimes(1)
    })

    it('should handle message content with different types correctly', async () => {
      const mockSession = {
        prompt: vi.fn().mockResolvedValue(),
        dispose: vi.fn(),
        state: {
          messages: [
            {
              role: 'user',
              content: [{ type: 'text', text: 'Start' }]
            },
            {
              role: 'assistant',
              content: [
                { type: 'text', text: 'Text part' },
                { type: 'tool_output', content: 'ignore' },
                { type: 'text', text: ' End' }
              ]
            }
          ],
          stopReason: null
        }
      }
      mockCreateAgentSession.mockResolvedValue({ session: mockSession })

      const result = await callText('Test')
      expect(result).toBe('Text part End')
    })

    it('retries on a transient connection error and succeeds once the server recovers', async () => {
      const okSession = {
        prompt: vi.fn().mockResolvedValue(),
        dispose: vi.fn(),
        state: { messages: [{ role: 'assistant', content: [{ type: 'text', text: 'OK' }] }] }
      }
      mockCreateAgentSession
        .mockRejectedValueOnce(new Error('Connection error.'))
        .mockRejectedValueOnce(new Error('Connection error.'))
        .mockResolvedValueOnce({ session: okSession })

      const result = await callText('Test')

      expect(result).toBe('OK')
      expect(mockCreateAgentSession).toHaveBeenCalledTimes(3)
    })

    it('does not retry non-transient errors (e.g. auth failure)', async () => {
      const failSession = {
        prompt: vi.fn().mockResolvedValue(),
        dispose: vi.fn(),
        state: {
          messages: [{ role: 'assistant', stopReason: 'error', errorMessage: 'Authentication failed', content: [] }]
        }
      }
      mockCreateAgentSession.mockResolvedValue({ session: failSession })

      await expect(callText('Test')).rejects.toThrow('pi error: Authentication failed')
      expect(mockCreateAgentSession).toHaveBeenCalledTimes(1)
    })

    it('gives up and throws after the max retry attempts are exhausted', async () => {
      mockCreateAgentSession.mockRejectedValue(new Error('Connection error.'))

      await expect(callText('Test')).rejects.toThrow('Connection error.')
      expect(mockCreateAgentSession).toHaveBeenCalledTimes(4)
    })

    it('retries a memory-guard rejection with backoff and throws after the bounded attempts are exhausted', async () => {
      mockCreateAgentSession.mockRejectedValue(
        new Error('Prefill would require ~12.32 GB peak but metal_cap ceiling is 11.84 GB.')
      )
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => null)

      const prompt = 'Summarize this huge source file...'
      await expect(callText(prompt)).rejects.toThrow('omlx memory-guard')

      // default N_PI_MEMORY_RETRY_ATTEMPTS = 3 — одно-слотова черга oMLX
      // вивільняє залишкову пам'ять сама, тож обмежений повтор легітимний
      expect(mockCreateAgentSession).toHaveBeenCalledTimes(3)
      expect(logSpy).toHaveBeenCalledWith(prompt)

      logSpy.mockRestore()
    })

    it('prints the request body only on the final memory-guard failure, not on intermediate attempts', async () => {
      mockCreateAgentSession.mockRejectedValue(new Error('oMLX prefill memory guard rejected this prompt'))
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => null)

      const prompt = 'body-printed-once'
      await expect(callText(prompt)).rejects.toThrow('omlx memory-guard')

      const bodyPrints = logSpy.mock.calls.filter(c => c[0] === prompt)
      expect(bodyPrints).toHaveLength(1)

      logSpy.mockRestore()
    })

    it('waits with the dedicated memory schedule between memory-guard attempts', async () => {
      mockCreateAgentSession.mockRejectedValue(new Error('memory limit reached'))
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => null)
      const sleepMock = vi.mocked(sleep)

      await expect(callText('x')).rejects.toThrow('omlx memory-guard')

      // 3 спроби → 2 паузи; база 15s з jitter 0.5–1.0, далі експоненційно
      expect(sleepMock).toHaveBeenCalledTimes(2)
      const [first, second] = sleepMock.mock.calls.map(c => c[0])
      expect(first).toBeGreaterThanOrEqual(7500)
      expect(first).toBeLessThanOrEqual(15000)
      expect(second).toBeGreaterThanOrEqual(15000)
      expect(second).toBeLessThanOrEqual(30000)

      logSpy.mockRestore()
    })

    it('recovers when a memory-guard rejection clears on a later attempt, without printing the body', async () => {
      const okSession = {
        prompt: vi.fn().mockResolvedValue(),
        dispose: vi.fn(),
        state: { messages: [{ role: 'assistant', content: [{ type: 'text', text: 'OK' }] }] }
      }
      mockCreateAgentSession
        .mockRejectedValueOnce(new Error('oMLX prefill memory guard rejected this prompt'))
        .mockResolvedValueOnce({ session: okSession })
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => null)

      const prompt = 'recovers-after-wait'
      const result = await callText(prompt)

      expect(result).toBe('OK')
      expect(mockCreateAgentSession).toHaveBeenCalledTimes(2)
      expect(logSpy).not.toHaveBeenCalledWith(prompt)

      logSpy.mockRestore()
    })

    it('wraps agent.streamFn to inject per-call maxTokens into stream options', async () => {
      const streamFnCalls = []
      const mockSession = {
        prompt: vi.fn().mockResolvedValue(),
        dispose: vi.fn(),
        agent: {
          streamFn: (model, ctx, options) => {
            streamFnCalls.push(options)
          }
        },
        state: { messages: [{ role: 'assistant', content: [{ type: 'text', text: 'OK' }] }] }
      }
      mockCreateAgentSession.mockResolvedValue({ session: mockSession })

      const result = await callText('Test', { maxTokens: 2048 })

      expect(result).toBe('OK')
      mockSession.agent.streamFn('m', 'ctx', { signal: 1 })
      expect(streamFnCalls[0]).toMatchObject({ signal: 1, maxTokens: 2048 })
    })

    it('retries once with doubled maxTokens when the response is truncated (stopReason length)', async () => {
      const makeSession = (text, stopReason) => ({
        prompt: vi.fn().mockResolvedValue(),
        dispose: vi.fn(),
        agent: { streamFn: vi.fn() },
        state: { messages: [{ role: 'assistant', stopReason, content: [{ type: 'text', text }] }] }
      })
      mockCreateAgentSession
        .mockResolvedValueOnce({ session: makeSession('обрізаний', 'length') })
        .mockResolvedValueOnce({ session: makeSession('повний', 'stop') })
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => null)

      const result = await callText('Test', { maxTokens: 2048 })

      expect(result).toBe('повний')
      expect(mockCreateAgentSession).toHaveBeenCalledTimes(2)

      logSpy.mockRestore()
    })

    it('does not retry truncation more than once', async () => {
      const truncated = () => ({
        prompt: vi.fn().mockResolvedValue(),
        dispose: vi.fn(),
        agent: { streamFn: vi.fn() },
        state: { messages: [{ role: 'assistant', stopReason: 'length', content: [{ type: 'text', text: 'half' }] }] }
      })
      mockCreateAgentSession.mockImplementation(async () => ({ session: truncated() }))
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => null)

      const result = await callText('Test', { maxTokens: 2048 })

      expect(result).toBe('half')
      expect(mockCreateAgentSession).toHaveBeenCalledTimes(2)

      logSpy.mockRestore()
    })

    it('attaches structured omlx fields from the 400 body to the thrown error', async () => {
      const body =
        'pi error: {"error":{"message":"oMLX prefill memory guard rejected this prompt",' +
        '"code":"prefill_memory_exceeded","omlx_code":"prefill_memory_exceeded",' +
        '"estimated_bytes":13006865768,"limit_bytes":12713115648},"type":"error"}'
      mockCreateAgentSession.mockRejectedValue(new Error(body))
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => null)

      let thrown
      try {
        await callText('structured')
      } catch (error) {
        thrown = error
      }

      expect(thrown.message).toContain('omlx memory-guard')
      expect(thrown.omlxCode).toBe('prefill_memory_exceeded')
      expect(thrown.estimatedBytes).toBe(13006865768)
      expect(thrown.limitBytes).toBe(12713115648)
      expect(thrown.cause).toBeInstanceOf(Error)

      logSpy.mockRestore()
    })
  })

  describe('callAgent', () => {
    it('should call createAgentSession with coding tools and specified cwd', async () => {
      const mockSession = {
        prompt: vi.fn().mockResolvedValue(),
        dispose: vi.fn()
        // State is irrelevant for callAgent as it returns void
      }
      const projectCwd = '/path/to/project'
      mockCreateAgentSession.mockResolvedValue({ session: mockSession })

      await callAgent('Write a test file', projectCwd)

      expect(mockCreateAgentSession).toHaveBeenCalledWith({
        tools: ['read', 'write', 'edit', 'bash', 'grep', 'find', 'ls'],
        sessionManager: expect.any(Object),
        cwd: projectCwd
      })
      expect(mockSession.prompt).toHaveBeenCalledWith('Write a test file')
      expect(mockSession.dispose).toHaveBeenCalledTimes(1)
    })

    it('disposes the session even when the agent prompt throws', async () => {
      const mockSession = {
        prompt: vi.fn().mockRejectedValue(new Error('Authentication failed')),
        dispose: vi.fn()
      }
      mockCreateAgentSession.mockResolvedValue({ session: mockSession })

      await expect(callAgent('Write a test file', '/tmp')).rejects.toThrow('Authentication failed')
      expect(mockSession.dispose).toHaveBeenCalledTimes(1)
    })

    it('should call createAgentSession with default tools if logic were to change (implicit test)', async () => {
      // Since the implementation hardcodes the tools list, we test that it is called as expected.
      const mockSession = {
        prompt: vi.fn().mockResolvedValue(),
        dispose: vi.fn()
      }
      mockCreateAgentSession.mockResolvedValue({ session: mockSession })

      await callAgent('Another prompt', '/tmp')

      expect(mockCreateAgentSession).toHaveBeenCalledTimes(1)
      const callArgs = mockCreateAgentSession.mock.calls[0][0]
      expect(callArgs.tools).toEqual(['read', 'write', 'edit', 'bash', 'grep', 'find', 'ls'])
    })
  })
})
