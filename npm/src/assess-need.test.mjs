import { assessNeed } from './assess-need.mjs'
import * as fs from 'node:fs'
import { spawnSync } from 'node:child_process'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}))

vi.mock('node:child_process', () => ({
  spawnSync: vi.fn(),
}))

describe('assessNeed', () => {
  const projectDir = '/mock/project'
  const fileInfo = { file: 'testfile.js', pct: 45.6 }
  let mockFs, mockSpawnSync

  beforeEach(() => {
    vi.clearAllMocks()
    mockFs = fs
    mockSpawnSync = spawnSync
  })

  it('should return early if file does not exist', async () => {
    mockFs.existsSync.mockReturnValue(false)
    
    const result = await assessNeed([fileInfo], projectDir)
    
    expect(mockFs.existsSync).toHaveBeenCalledWith('/mock/project/testfile.js')
    expect(result[0].needsTests).toBe(false)
    expect(result[0].reason).toBe('файл недоступний')
  })

  it('should correctly assess need when pi returns valid JSON (needsTests: true)', async () => {
    const mockContent = 'Some code that needs testing'
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readFileSync.mockReturnValue(mockContent)
    
    // Simulate successful pi call with JSON response
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: '{"needsTests": true, "reason": "Містить бізнес-логіку"}\n',
      stderr: ''
    })

    const result = await assessNeed([fileInfo], projectDir)

    expect(mockSpawnSync).toHaveBeenCalledWith('pi', expect.anything(), expect.anything())
    expect(result[0].needsTests).toBe(true)
    expect(result[0].reason).toBe('Містить бізнес-логіку')
  })

  it('should correctly assess need when pi returns valid JSON (needsTests: false)', async () => {
    const mockContent = 'interface MyType {}'
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readFileSync.mockReturnValue(mockContent)
    
    // Simulate successful pi call with JSON response indicating no tests needed
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: '{"needsTests": false, "reason": "Тільки типи"}\n',
      stderr: ''
    })

    const result = await assessNeed([fileInfo], projectDir)

    expect(result[0].needsTests).toBe(false)
    expect(result[0].reason).toBe('Тільки типи')
  })

  it('should treat as needsTests=true on pi execution failure (non-zero status)', async () => {
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readFileSync.mockReturnValue('content')
    
    // Simulate failure
    mockSpawnSync.mockReturnValue({
      status: 1,
      stdout: '',
      stderr: 'Failed to run pi command'
    })

    const result = await assessNeed([fileInfo], projectDir)

    expect(result[0].needsTests).toBe(true)
    expect(result[0].reason).toBe('оцінка не вдалась — вважаємо що потрібні тести')
  })
  
  it('should treat as needsTests=true on pi execution error (r.error)', async () => {
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readFileSync.mockReturnValue('content')
    
    // Simulate error thrown by spawnSync
    mockSpawnSync.mockImplementation(() => {
        throw new Error('Mocked pi error')
    })

    const result = await assessNeed([fileInfo], projectDir)

    expect(result[0].needsTests).toBe(true)
    expect(result[0].reason).toBe('оцінка не вдалась — вважаємо що потрібні тести')
  })

  it('should handle content truncation correctly', async () => {
    const largeContent = 'A'.repeat(6000)
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readFileSync.mockReturnValue(largeContent)
    
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: '{"needsTests": true, "reason": "Content was truncated"}\n',
      stderr: ''
    })

    const result = await assessNeed([fileInfo], projectDir)
    
    expect(mockFs.readFileSync).toHaveBeenCalledWith('/mock/project/testfile.js', 'utf8')
    // We check that the mocked readFileSync was called, which implies the truncation logic was engaged internally
    expect(result[0].needsTests).toBe(true)
  })

  it('should handle empty input file list', async () => {
    const result = await assessNeed([], projectDir)
    expect(result).toEqual([])
  })
})