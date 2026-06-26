import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

vi.mock('./omlx.mjs', () => ({
  callOmlxRaw: vi.fn(),
  isOmlxModel: vi.fn()
}))
vi.mock('./omlx-trace.mjs', () => ({
  buildTraceRecord: vi.fn().mockReturnValue({}),
  writeTrace: vi.fn()
}))
vi.mock('node:child_process', () => ({ spawnSync: vi.fn() }))

import { callOmlxRaw, isOmlxModel } from './omlx.mjs'
import { writeTrace } from './omlx-trace.mjs'
import { spawnSync } from 'node:child_process'
import { pickBackend, callLlmRich, callLlm } from './llm.mjs'

const messages = [{ role: 'user', content: 'Hello' }]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('pickBackend', () => {
  it('should return "omlx" if the model ID starts with "omlx/"', () => {
    vi.mocked(isOmlxModel).mockReturnValue(true)
    expect(pickBackend('omlx/some-model')).toBe('omlx')
  })

  it('should return "pi" if the model ID does not start with "omlx/"', () => {
    vi.mocked(isOmlxModel).mockReturnValue(false)
    expect(pickBackend('gpt-4o')).toBe('pi')
  })

  it('should return "pi" for an empty model ID', () => {
    vi.mocked(isOmlxModel).mockReturnValue(false)
    expect(pickBackend('')).toBe('pi')
  })
})

describe('callLlmRich - Omlx Backend', () => {
  const mockRaw = {
    content: 'Omlx content',
    reasoning: 'Omlx reasoning',
    reasoningSource: 'omlx-source',
    finishReason: 'stop',
    usage: { input_tokens: 10, output_tokens: 20 },
    attempts: 1
  }

  beforeEach(() => {
    vi.mocked(isOmlxModel).mockReturnValue(true)
    vi.mocked(callOmlxRaw).mockReturnValue(mockRaw)
  })

  it('should call callOmlxRaw with correct arguments', () => {
    callLlmRich(messages, 'omlx/test-model', { caller: 'test', timeoutMs: 5000 })
    expect(callOmlxRaw).toHaveBeenCalledWith(
      messages,
      'omlx/test-model',
      expect.objectContaining({ url: undefined, timeoutMs: 5000 })
    )
  })

  it('should return content/reasoning/reasoningSource', () => {
    const result = callLlmRich(messages, 'omlx/test-model')
    expect(result).toEqual({
      content: 'Omlx content',
      reasoning: 'Omlx reasoning',
      reasoningSource: 'omlx-source'
    })
  })

  it('should call writeTrace on success', () => {
    callLlmRich(messages, 'omlx/test-model')
    expect(writeTrace).toHaveBeenCalledTimes(1)
  })

  it('should call writeTrace and rethrow on callOmlxRaw error', () => {
    vi.mocked(callOmlxRaw).mockImplementation(() => {
      throw new Error('API error')
    })
    expect(() => callLlmRich(messages, 'omlx/test-model')).toThrow('API error')
    expect(writeTrace).toHaveBeenCalledTimes(1)
  })
})

describe('callLlmRich - Pi Backend', () => {
  beforeEach(() => {
    vi.mocked(isOmlxModel).mockReturnValue(false)
  })

  it('should call spawnSync and return content on success', () => {
    vi.mocked(spawnSync).mockReturnValue({ stdout: 'Pi response', stderr: '', status: 0, error: null })
    const result = callLlmRich(messages, 'gpt-3.5-turbo')
    expect(result).toEqual({ content: 'Pi response', reasoning: null, reasoningSource: null })
    expect(writeTrace).toHaveBeenCalledTimes(1)
  })

  it('should throw on non-zero exit status', () => {
    vi.mocked(spawnSync).mockReturnValue({ stdout: '', stderr: 'Error output', status: 1, error: null })
    expect(() => callLlmRich(messages, 'gpt-3.5-turbo')).toThrow('pi exit 1')
    expect(writeTrace).toHaveBeenCalledTimes(1)
  })

  it('should throw on spawnSync OS error', () => {
    vi.mocked(spawnSync).mockReturnValue({ stdout: '', stderr: '', status: 0, error: new Error('ENOENT') })
    expect(() => callLlmRich(messages, 'gpt-3.5-turbo')).toThrow('pi error: ENOENT')
    expect(writeTrace).toHaveBeenCalledTimes(1)
  })
})

describe('callLlm', () => {
  beforeEach(() => {
    vi.mocked(isOmlxModel).mockReturnValue(false)
    vi.mocked(spawnSync).mockReturnValue({ stdout: 'content', stderr: '', status: 0, error: null })
  })

  it('should return only the content string', () => {
    const result = callLlm(messages, 'gpt-3.5-turbo')
    expect(result).toBe('content')
  })
})
