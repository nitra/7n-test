import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { writeFileSync } from 'node:fs'
import piExtension from '../index.ts'

vi.mock('node:fs', () => ({ writeFileSync: vi.fn() }))

/**
 * Реєструє extension на fake pi API.
 * @returns {{pi: object, handler: (event: object, ctx: object) => Promise<void>}} fake pi та agent_end handler
 */
function setup() {
  const pi = {
    on: vi.fn(),
    exec: vi.fn().mockResolvedValue({ code: 0, stdout: '', stderr: '' })
  }
  piExtension(pi)
  const handler = pi.on.mock.calls.find(([event]) => event === 'agent_end')[1]
  return { pi, handler }
}

/**
 * Мінімальний pi-контекст для handler-а.
 * @param {object} [overrides] поля, що перекривають дефолти
 * @returns {object} fake ctx
 */
function makeCtx(overrides = {}) {
  return {
    cwd: '/proj',
    sessionId: 'sid-1',
    sessionManager: { getEntries: vi.fn().mockReturnValue([]) },
    ui: { notify: vi.fn() },
    ...overrides
  }
}

describe('n-cursor-adr pi extension', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.unstubAllEnvs())

  it('реєструє handler на agent_end', () => {
    const { pi } = setup()
    expect(pi.on).toHaveBeenCalledWith('agent_end', expect.any(Function))
  })

  it.each(['CAPTURE_DECISIONS_RUNNING', 'ADR_NORMALIZE_RUNNING', 'ADR_HOOKS_SKIP'])(
    'пропускає запуск, коли виставлено %s (recursion/skip guard)',
    async guard => {
      vi.stubEnv(guard, '1')
      const { pi, handler } = setup()
      const ctx = makeCtx()
      await handler({ type: 'agent_end' }, ctx)
      expect(ctx.sessionManager.getEntries).not.toHaveBeenCalled()
      expect(writeFileSync).not.toHaveBeenCalled()
      expect(pi.exec).not.toHaveBeenCalled()
    }
  )

  it('серіалізує лише user/assistant повідомлення у tmp JSONL і спавнить обидва hooks', async () => {
    const { pi, handler } = setup()
    const entries = [
      { message: { role: 'user', content: 'Питання' } },
      { message: { role: 'system', content: 'ігнорується' } },
      { message: { role: 'assistant', content: 'Відповідь' } },
      { notAMessage: true }
    ]
    const ctx = makeCtx({ sessionManager: { getEntries: vi.fn().mockReturnValue(entries) } })

    await handler({ type: 'agent_end' }, ctx)

    // transcript: tmp-файл, JSONL лише з user/assistant
    expect(writeFileSync).toHaveBeenCalledTimes(1)
    const [jsonlPath, jsonl] = vi.mocked(writeFileSync).mock.calls[0]
    expect(jsonlPath).toContain('n-cursor-pi-transcript-')
    const lines = jsonl
      .trim()
      .split('\n')
      .map(l => JSON.parse(l))
    expect(lines).toHaveLength(2)
    expect(lines[0]).toEqual({ type: 'user', message: { role: 'user', content: 'Питання' } })
    expect(lines[1].type).toBe('assistant')

    // обидва bash-hooks зі спільним stdin-payload і CLAUDE_PROJECT_DIR
    expect(pi.exec).toHaveBeenCalledTimes(2)
    const hookScripts = pi.exec.mock.calls.map(([cmd, args]) => {
      expect(cmd).toBe('bash')
      return args[0]
    })
    expect(hookScripts).toEqual(['.claude/hooks/capture-decisions.sh', '.claude/hooks/normalize-decisions.sh'])
    for (const call of pi.exec.mock.calls) {
      const opts = call[2]
      expect(opts.cwd).toBe('/proj')
      expect(opts.env.CLAUDE_PROJECT_DIR).toBe('/proj')
      const payload = JSON.parse(opts.input)
      expect(payload.transcript_path).toBe(jsonlPath)
      expect(payload.session_id).toBe('sid-1')
    }
  })

  it('генерує session_id, коли ctx.sessionId відсутній', async () => {
    const { pi, handler } = setup()
    await handler({ type: 'agent_end' }, makeCtx({ sessionId: undefined }))
    const payload = JSON.parse(pi.exec.mock.calls[0][2].input)
    expect(payload.session_id).toBeTruthy()
  })

  it('нотифікує ui і не запускає hooks, коли серіалізація transcript падає', async () => {
    const { pi, handler } = setup()
    const ctx = makeCtx({
      sessionManager: {
        getEntries: vi.fn(() => {
          throw new Error('boom')
        })
      }
    })
    await handler({ type: 'agent_end' }, ctx)
    expect(ctx.ui.notify).toHaveBeenCalledWith(expect.stringContaining('transcript serialization failed'), 'error')
    expect(pi.exec).not.toHaveBeenCalled()
  })

  it('не кидає, коли pi.exec падає (hooks відсутні у pi-only консьюмера)', async () => {
    const { pi, handler } = setup()
    pi.exec.mockRejectedValue(new Error('ENOENT'))
    await expect(handler({ type: 'agent_end' }, makeCtx())).resolves.toBeUndefined()
  })
})
