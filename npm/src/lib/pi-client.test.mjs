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

describe('pi-client.mjs', () => {
  const mockCreateAgentSession = vi.mocked(createAgentSession)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('callText', () => {
    it('should call createAgentSession with correct parameters and return assistant content on success', async () => {
      const mockSession = {
        prompt: vi.fn().mockResolvedValue(undefined),
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
        prompt: vi.fn().mockResolvedValue(undefined),
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
        prompt: vi.fn().mockResolvedValue(undefined),
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
        prompt: vi.fn().mockResolvedValue(undefined),
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
        prompt: vi.fn().mockResolvedValue(undefined),
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
  })

  describe('callAgent', () => {
    it('should call createAgentSession with coding tools and specified cwd', async () => {
      const mockSession = {
        prompt: vi.fn().mockResolvedValue(undefined)
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
        prompt: vi.fn().mockResolvedValue(undefined)
      }
      mockCreateAgentSession.mockResolvedValue({ session: mockSession })

      await callAgent('Another prompt', '/tmp')

      expect(mockCreateAgentSession).toHaveBeenCalledTimes(1)
      const callArgs = mockCreateAgentSession.mock.calls[0][0]
      expect(callArgs.tools).toEqual(['read', 'write', 'edit', 'bash', 'grep', 'find', 'ls'])
    })
  })
})
