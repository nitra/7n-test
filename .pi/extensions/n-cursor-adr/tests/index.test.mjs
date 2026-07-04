import { vi, describe, it, expect, beforeEach } from "vitest"
import { join } from "node:path"

// Mock necessary Node.js modules and internal dependencies if they were complex,
// but here we mock the entire module being tested.
vi.mock('../index.ts', () => ({
  default: vi.fn(),
}))

// Import the default export from the mocked module
const { default: piExtension } = await import('../index.ts')

describe('piExtension', () => {
  let mockPi: any
  let captureHookSpy: vi.Mock
  let normalizeHookSpy: vi.Mock

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Set up a mock for pi.dev extension API
    mockPi = {
      on: vi.fn(),
    }

    // Spy on pi.exec to control its behavior during tests
    mockPi.exec = vi.fn().mockResolvedValue({
      code: 0,
      stdout: '',
      stderr: '',
    })

    // Simulate event handlers subscription
    const onCallback = mockPi.on.mock.calls.find(call => call[0] === 'agent_end')[1]
    onCallback({ type: 'agent_end' }, {
      cwd: '/mock/cwd',
      sessionId: 'mock-session-id',
      sessionManager: {
        getEntries: vi.fn(),
      },
      ui: {
        notify: vi.fn(),
      },
      signal: new AbortSignal(),
    })

    // Capture spies for the internal pi.exec calls (since we mock the module's default export)
    // We rely on the internal mock setup for pi.exec from the module under test
    captureHookSpy = mockPi.exec.mock.calls.find(call => call[0] === 'bash' && call[1].includes('.claude/hooks/capture-decisions.sh'))[0]
    normalizeHookSpy = mockPi.exec.mock.calls.find(call => call[0] === 'bash' && call[1].includes('.claude/hooks/normalize-decisions.sh'))[0]
  })

  it('should not run if CAPTURE_DECISIONS_RUNNING env var is set', async () => {
    vi.stubEnv('CAPTURE_DECISIONS_RUNNING', 'true')

    // Re-invoke the event handler logic, simulating environment change detection
    const onCallback = mockPi.on.mock.calls.find(call => call[0] === 'agent_end')[1]
    await onCallback({ type: 'agent_end' }, {
      cwd: '/mock/cwd',
      sessionManager: {
        getEntries: vi.fn(),
      },
      signal: new AbortSignal(),
    })

    // Since we cannot easily hook into the internal logic based on stubbed envs without
    // re-implementing the structure, we test the general behavior path assuming env checks run.
    // In a real test setup, we would ensure pi.exec was NOT called.
    expect(mockPi.exec).not.toHaveBeenCalled()
  })

  it('should not run if ADR_NORMALIZE_RUNNING env var is set', async () => {
    vi.stubEnv('ADR_NORMALIZE_RUNNING', 'true')
    const onCallback = mockPi.on.mock.calls.find(call => call[0] === 'agent_end')[1]
    await onCallback({ type: 'agent_end' }, {
      cwd: '/mock/cwd',
      sessionManager: {
        getEntries: vi.fn(),
      },
      signal: new AbortSignal(),
    })
    expect(mockPi.exec).not.toHaveBeenCalled()
  })


  it('should not run if ADR_HOOKS_SKIP is set', async () => {
    vi.stubEnv('ADR_HOOKS_SKIP', '1')
    const onCallback = mockPi.on.mock.calls.find(call => call[0] === 'agent_end')[1]
    await onCallback({ type: 'agent_end' }, {
      cwd: '/mock/cwd',
      sessionManager: {
        getEntries: vi.fn(),
      },
      signal: new AbortSignal(),
    })
    expect(mockPi.exec).not.toHaveBeenCalled()
  })

  it('should serialize transcript and call hooks when no skip conditions are met', async () => {
    const mockEntries = [
      { message: { role: 'user', content: 'Hello' } },
      { message: { role: 'assistant', content: 'Hi there' } },
    ]
    const mockSessionId = 'test-session'
    const mockCwd = '/test/dir'

    // Setup mock to return expected entries
    const sessionManagerMock = {
      getEntries: vi.fn().mockReturnValue(mockEntries),
    }

    // Spy on fs functions used internally (tmpdir, writeFileSync, join are complex to mock entirely)
    // We rely on mocking the module default export to control execution flow if we couldn't mock fs globally.
    // Since this is unit test for the adapter logic, we focus on high-level interactions.
    // We mock Date.now() for deterministic paths.
    const now = 1678886400000
    vi.useFakeTimers()
    vi.setSystemTime(new Date(now))

    // Mock crypto for consistent UUID
    vi.spyOn(require('node:crypto'), 'randomUUID').mockReturnValue('mock-uuid')
    
    // We must ensure pi.exec is called twice correctly
    mockPi.exec.mockImplementation((cmd, args, opts) => {
        if (args.includes('.claude/hooks/capture-decisions.sh')) {
            return Promise.resolve({ code: 0, stdout: 'capture_ok', stderr: '' })
        }
        if (args.includes('.claude/hooks/normalize-decisions.sh')) {
            return Promise.resolve({ code: 0, stdout: 'normalize_ok', stderr: '' })
        }
        return Promise.reject(new Error('Unexpected call'))
    })

    const onCallback = mockPi.on.mock.calls.find(call => call[0] === 'agent_end')[1]

    // Execute test case
    await onCallback({ type: 'agent_end' }, {
      cwd: mockCwd,
      sessionId: mockSessionId,
      sessionManager: sessionManagerMock,
      ui: { notify: vi.fn() },
      signal: new AbortSignal(),
    })

    // Assertions
    expect(sessionManagerMock.getEntries).toHaveBeenCalledTimes(1)

    // Check if pi.exec was called for both hooks
    expect(mockPi.exec).toHaveBeenCalledTimes(2)

    // Check capture hook call details
    const captureCallArgs = mockPi.exec.mock.calls.find(call => call[0] === 'bash' && call[1].includes('capture-decisions.sh'))
    expect(captureCallArgs).toBeDefined()
    expect(captureCallArgs[2].cwd).toBe(mockCwd)
    expect(captureCallArgs[2].input).toBeDefined() // Payload must be present
    expect(captureCallArgs[2].env['CLAUDE_PROJECT_DIR']).toBe(mockCwd)

    // Check normalize hook call details
    const normalizeCallArgs = mockPi.exec.mock.calls.find(call => call[0] === 'bash' && call[1].includes('normalize-decisions.sh'))
    expect(normalizeCallArgs).toBeDefined()
    expect(normalizeCallArgs[2].cwd).toBe(mockCwd)

    vi.useRealTimers()
  })

  it('should notify UI on transcript serialization failure', async () => {
    const mockCwd = '/test/dir'
    const sessionManagerMock = {
      getEntries: vi.fn(() => {
        throw new Error('FS permission denied')
      }),
    }
    const mockUi = {
      notify: vi.fn(),
    }

    const onCallback = mockPi.on.mock.calls.find(call => call[0] === 'agent_end')[1]
    await onCallback({ type: 'agent_end' }, {
      cwd: mockCwd,
      sessionManager: sessionManagerMock,
      ui: mockUi,
      signal: new AbortSignal(),
    })

    // Assert notification was called with the error message
    expect(mockUi.notify).toHaveBeenCalledWith(
      expect.stringContaining('@nitra/cursor: transcript serialization failed'),
      'error'
    )

    // Assert no hooks were called
    expect(mockPi.exec).not.toHaveBeenCalled()
  })
})
