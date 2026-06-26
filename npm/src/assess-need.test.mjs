import { vi, describe, it, expect, beforeEach } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { assessNeed } from './assess-need.mjs'

vi.mock('node:fs', () => ({ existsSync: vi.fn(), readFileSync: vi.fn() }))
vi.mock('node:path', () => ({ join: vi.fn((...a) => a.join('/')) }))
vi.mock('./lib/pi-client.mjs', () => ({ callText: vi.fn() }))

const DIR = '/proj'
const mockCallText = vi.fn()

describe('assess-need.mjs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns needsTests:false when file not found', async () => {
    vi.mocked(existsSync).mockReturnValue(false)
    const result = await assessNeed([{ file: 'src/a.mjs', pct: 0 }], DIR, { callText: mockCallText })
    expect(result[0].needsTests).toBe(false)
    expect(result[0].reason).toBe('файл недоступний')
    expect(mockCallText).not.toHaveBeenCalled()
  })

  it('calls callText and parses JSON response', async () => {
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('export const x = 1')
    mockCallText.mockResolvedValue('{"needsTests": true, "reason": "має логіку"}')

    const result = await assessNeed([{ file: 'src/a.mjs', pct: 20 }], DIR, { callText: mockCallText })
    expect(mockCallText).toHaveBeenCalledOnce()
    expect(result[0].needsTests).toBe(true)
    expect(result[0].reason).toBe('має логіку')
  })

  it('returns needsTests:false when LLM says false', async () => {
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('export { x } from "./x.mjs"')
    mockCallText.mockResolvedValue('{"needsTests": false, "reason": "лише re-export"}')

    const result = await assessNeed([{ file: 'src/b.mjs', pct: 0 }], DIR, { callText: mockCallText })
    expect(result[0].needsTests).toBe(false)
  })

  it('defaults needsTests:true on parse error', async () => {
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('const x = 1')
    mockCallText.mockResolvedValue('not json')

    const result = await assessNeed([{ file: 'src/c.mjs', pct: 10 }], DIR, { callText: mockCallText })
    expect(result[0].needsTests).toBe(true)
  })

  it('defaults needsTests:true when callText throws', async () => {
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('const x = 1')
    mockCallText.mockRejectedValue(new Error('network error'))

    const result = await assessNeed([{ file: 'src/d.mjs', pct: 5 }], DIR, { callText: mockCallText })
    expect(result[0].needsTests).toBe(true)
  })

  it('truncates large files before sending', async () => {
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('x'.repeat(10000))
    mockCallText.mockResolvedValue('{"needsTests": false, "reason": "test"}')

    await assessNeed([{ file: 'src/big.mjs', pct: 0 }], DIR, { callText: mockCallText })
    const prompt = mockCallText.mock.calls[0][0]
    expect(prompt).toContain('truncated')
  })

  it('processes multiple files in parallel', async () => {
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFileSync).mockReturnValue('const x = 1')
    mockCallText.mockResolvedValue('{"needsTests": true, "reason": "logic"}')

    const files = [
      { file: 'src/a.mjs', pct: 10 },
      { file: 'src/b.mjs', pct: 20 },
    ]
    const result = await assessNeed(files, DIR, { callText: mockCallText })
    expect(result).toHaveLength(2)
    expect(mockCallText).toHaveBeenCalledTimes(2)
  })
})
