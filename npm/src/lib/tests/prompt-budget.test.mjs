import { describe, it, expect } from 'vitest'
import { budgetFor, capText, fitToBudget, packBatch } from '../prompt-budget.mjs'

describe('prompt-budget.mjs', () => {
  describe('budgetFor', () => {
    it('returns budgets per task kind with header smallest', () => {
      const header = budgetFor('header')
      const block = budgetFor('block')
      const fix = budgetFor('fix')
      expect(header.maxTokens).toBeLessThan(block.maxTokens)
      expect(block.maxPromptChars).toBeLessThan(fix.maxPromptChars)
      expect(budgetFor('single-file').maxTokens).toBe(fix.maxTokens)
    })

    it('returns a copy so callers cannot mutate shared budgets', () => {
      const a = budgetFor('block')
      a.maxTokens = 1
      expect(budgetFor('block').maxTokens).not.toBe(1)
    })

    it('throws for an unknown task kind', () => {
      expect(() => budgetFor('nope')).toThrow('невідомий taskKind')
    })
  })

  describe('capText', () => {
    it('returns short text unchanged', () => {
      expect(capText('короткий', 100)).toBe('короткий')
    })

    it('truncates the middle keeping head and tail with a marker', () => {
      const text = 'A'.repeat(500) + 'MIDDLE' + 'B'.repeat(500)
      const capped = capText(text, 300)
      expect(capped).toContain('обрізано')
      expect(capped.startsWith('A')).toBe(true)
      expect(capped.endsWith('B')).toBe(true)
      expect(capped).not.toContain('MIDDLE')
    })
  })

  describe('fitToBudget', () => {
    it('returns joined text untouched when it fits', () => {
      const { text, dropped } = fitToBudget(
        [
          { text: 'перший', priority: 0 },
          { text: 'другий', priority: 1 }
        ],
        1000
      )
      expect(text).toBe('перший\nдругий')
      expect(dropped).toEqual([])
    })

    it('truncates the lowest-priority chunk first and never touches the protected one', () => {
      const task = 'ЗАДАЧА: ' + 'z'.repeat(200)
      const { text, dropped } = fitToBudget(
        [
          { text: 'x'.repeat(5000), priority: 0, label: 'source' },
          { text: task, priority: 1, label: 'task' }
        ],
        1500
      )
      expect(text).toContain(task)
      expect(text.length).toBeLessThanOrEqual(1600)
      expect(dropped.some(d => d.startsWith('source'))).toBe(true)
    })

    it('drops whole low-priority chunks when truncation is not enough', () => {
      const { text, dropped } = fitToBudget(
        [
          { text: 'a'.repeat(3000), priority: 0, label: 'low' },
          { text: 'b'.repeat(3000), priority: 1, label: 'mid' },
          { text: 'задача', priority: 2, label: 'task' }
        ],
        900
      )
      expect(text).toContain('задача')
      expect(dropped.some(d => d.includes('видалено'))).toBe(true)
    })
  })

  describe('packBatch', () => {
    it('includes everything when the budget allows', () => {
      const { included, deferred } = packBatch(
        [
          { key: 'a', size: 100 },
          { key: 'b', size: 200 }
        ],
        1000
      )
      expect(included).toEqual(['a', 'b'])
      expect(deferred).toEqual([])
    })

    it('packs smallest-first and defers the rest', () => {
      const { included, deferred } = packBatch(
        [
          { key: 'big', size: 900 },
          { key: 'small', size: 100 },
          { key: 'mid', size: 400 }
        ],
        600
      )
      expect(included).toEqual(['small', 'mid'])
      expect(deferred).toEqual(['big'])
    })

    it('defers even a single item that alone exceeds the budget', () => {
      const { included, deferred } = packBatch([{ key: 'huge', size: 5000 }], 1000)
      expect(included).toEqual([])
      expect(deferred).toEqual(['huge'])
    })
  })
})
