import { vi, describe, it, expect, beforeEach } from 'vitest'
import { readNCursorConfigLite, isRuleEnabled } from './read-n-cursor-config-lite.mjs'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'

vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }))
vi.mock('node:fs', () => ({ existsSync: vi.fn() }))

describe('readNCursorConfigLite', () => {
  const MOCK_CWD = '/mock/cwd'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(process, 'cwd').mockReturnValue(MOCK_CWD)
  })

  it('should return default configuration when config file does not exist', async () => {
    vi.mocked(existsSync).mockReturnValue(false)

    const config = await readNCursorConfigLite(MOCK_CWD)

    expect(config.exists).toBe(false)
    expect(config.rules).toEqual([])
    expect(config.disableRules).toEqual([])
    expect(vi.mocked(readFile)).not.toHaveBeenCalled()
  })

  it('should parse configuration correctly when file exists and contains rules', async () => {
    const mockConfig = { rules: ['ruleA', 'ruleB'], 'disable-rules': ['ruleZ'] }
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockConfig))

    const config = await readNCursorConfigLite(MOCK_CWD)

    expect(config.exists).toBe(true)
    expect(config.rules).toEqual(['ruleA', 'ruleB'])
    expect(config.disableRules).toEqual(['ruleZ'])
  })

  it('should handle missing or non-array fields gracefully', async () => {
    const mockConfig = { rules: 'not_an_array', 'disable-rules': { a: 1 } }
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockConfig))

    const config = await readNCursorConfigLite(MOCK_CWD)

    expect(config.exists).toBe(true)
    expect(config.rules).toEqual([])
    expect(config.disableRules).toEqual([])
  })

  it('should filter out non-string entries in rules and disableRules', async () => {
    const mockConfig = { rules: ['ruleA', 123, null, 'ruleB'], 'disable-rules': ['ruleX', true] }
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockConfig))

    const config = await readNCursorConfigLite(MOCK_CWD)

    expect(config.exists).toBe(true)
    expect(config.rules).toEqual(['ruleA', 'ruleB'])
    expect(config.disableRules).toEqual(['ruleX'])
  })

  it('should return default configuration if file exists but is empty JSON', async () => {
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readFile).mockResolvedValue(JSON.stringify({}))

    const config = await readNCursorConfigLite(MOCK_CWD)

    expect(config.exists).toBe(true)
    expect(config.rules).toEqual([])
    expect(config.disableRules).toEqual([])
  })
})

describe('isRuleEnabled', () => {
  const mockConfigBase = {
    exists: true,
    rules: ['ruleA', 'ruleB'],
    disableRules: ['ruleZ']
  }

  it("should return true when config does not exist (default 'open by default')", () => {
    const config = { exists: false, rules: [], disableRules: [] }
    expect(isRuleEnabled(config, 'anyRule')).toBe(true)
  })

  it('should return false when rule is explicitly in disableRules', () => {
    expect(isRuleEnabled(mockConfigBase, 'ruleZ')).toBe(false)
  })

  it('should return true when rule is present in rules list and not disabled', () => {
    expect(isRuleEnabled(mockConfigBase, 'ruleA')).toBe(true)
  })

  it('should return false when rule is not in rules and not explicitly disabled', () => {
    expect(isRuleEnabled(mockConfigBase, 'unlistedRule')).toBe(false)
  })

  it('should return false if config exists but has no rules and rule is not disabled', () => {
    const config = { exists: true, rules: [], disableRules: [] }
    expect(isRuleEnabled(config, 'someRule')).toBe(false)
  })

  it('should return true if config exists but has no disable rules and rule is in rules', () => {
    const config = { exists: true, rules: ['someRule'], disableRules: [] }
    expect(isRuleEnabled(config, 'someRule')).toBe(true)
  })
})
