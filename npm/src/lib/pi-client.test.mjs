import { vi, describe, it, expect, beforeEach } from 'vitest'
import { callText, callAgent } from './pi-client.mjs'
import { createAgentSession, SessionManager } from '@earendil-works/pi-coding-agent'

// Mock the entire pi-coding-agent SDK
vi.mock('@earendil-works/pi-coding-agent', () => ({
  createAgentSession: vi.fn(),
  SessionManager: {
    inMemory: vi.fn().mockReturnValue({ type: 'inMemory' })
  }
}))

// Skip actual backoff delays so retry tests run instantly
vi.mock('node:timers/promises', () => ({ setTimeout: vi.fn().mockResolvedValue() }))

describe('pi-client.mjs', () => {
  const mockCreateAgentSession = vi.mocked(createAgentSession)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('callText', () => {
    it('should call createAgentSession with correct parameters and return assistant content on success', async () => {
      const mockSession = {
        prompt: vi.fn().mockResolvedValue(),
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

    it('should handle message content with different types correctly', async () => {
      const mockSession = {
        prompt: vi.fn().mockResolvedValue(),
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

    it('prints the request body and throws on a memory-guard rejection, without retrying', async () => {
      mockCreateAgentSession.mockRejectedValue(
        new Error('Prefill would require ~12.32 GB peak but metal_cap ceiling is 11.84 GB.')
      )
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => null)

      const prompt = 'Summarize this huge source file...'
      await expect(callText(prompt)).rejects.toThrow('omlx memory-guard')

      expect(mockCreateAgentSession).toHaveBeenCalledTimes(1)
      expect(logSpy).toHaveBeenCalledWith(prompt)

      logSpy.mockRestore()
    })
  })

  describe('callAgent', () => {
    it('should call createAgentSession with coding tools and specified cwd', async () => {
      const mockSession = {
        prompt: vi.fn().mockResolvedValue()
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
    })

    it('should call createAgentSession with default tools if logic were to change (implicit test)', async () => {
      // Since the implementation hardcodes the tools list, we test that it is called as expected.
      const mockSession = {
        prompt: vi.fn().mockResolvedValue()
      }
      mockCreateAgentSession.mockResolvedValue({ session: mockSession })

      await callAgent('Another prompt', '/tmp')

      expect(mockCreateAgentSession).toHaveBeenCalledTimes(1)
      const callArgs = mockCreateAgentSession.mock.calls[0][0]
      expect(callArgs.tools).toEqual(['read', 'write', 'edit', 'bash', 'grep', 'find', 'ls'])
    })
  })
})
