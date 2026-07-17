/**
 * Тести Storybook mutation executor-а (storybook-mutation.mjs): AST-генерація
 * мутантів по тірах, lcov DA-парсинг, mutate→run→restore цикл із гарантією
 * відновлення та бюджетами.
 */
import { describe, expect, test } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { generateMutants, parseLcovCoveredLines, runStorybookMutation } from '../storybook-mutation.mjs'

/**
 * Множина усіх рядків 1..n — «усе покрито».
 * @param {number} n кількість рядків
 * @returns {Set<number>} множина 1..n
 */
function allLines(n) {
  return new Set(Array.from({ length: n }, (_, i) => i + 1))
}

/**
 * Fixture: тимчасовий root із одним файлом.
 * @param {string} file відносний шлях файлу
 * @param {string} content вміст файлу
 * @returns {string} абсолютний шлях тимчасового кореня
 */
function makeRoot(file, content) {
  const dir = mkdtempSync(join(tmpdir(), 'sb-mut-'))
  mkdirSync(join(dir, 'src'), { recursive: true })
  writeFileSync(join(dir, file), content)
  return dir
}

describe('parseLcovCoveredLines', () => {
  test('збирає лише рядки з hits > 0, рібейзить абсолютні шляхи', () => {
    const lcov = [
      'TN:',
      'SF:/root/src/Card.vue',
      'DA:1,1',
      'DA:2,0',
      'DA:3,5',
      'LF:3',
      'LH:2',
      'end_of_record',
      'SF:/root/src/util.js',
      'DA:10,2',
      'end_of_record',
      ''
    ].join('\n')
    const map = parseLcovCoveredLines(lcov, '/root')
    expect(map.get('src/Card.vue')).toEqual(new Set([1, 3]))
    expect(map.get('src/util.js')).toEqual(new Set([10]))
  })

  test('відкидає файли поза baseDir і records без покритих рядків', () => {
    const lcov = ['SF:/elsewhere/a.js', 'DA:1,1', 'end_of_record', 'SF:/root/b.js', 'DA:1,0', 'end_of_record'].join(
      '\n'
    )
    const map = parseLcovCoveredLines(lcov, '/root')
    expect(map.size).toBe(0)
  })

  test('відносні SF-шляхи лишаються як є', () => {
    const lcov = ['SF:src/c.js', 'DA:2,1', 'end_of_record'].join('\n')
    expect(parseLcovCoveredLines(lcov, '/root').get('src/c.js')).toEqual(new Set([2]))
  })
})

describe('generateMutants — оператори по тірах', () => {
  test('tier 1 boundary: < → <=, >= → >', () => {
    const src = 'export function f(x) {\n  if (x < 5) return 1\n  return x >= 9 ? 2 : 3\n}\n'
    const mutants = generateMutants('a.js', src, allLines(10))
    const boundary = mutants.filter(m => m.mutantType === 'ConditionalExpression')
    expect(boundary.map(m => `${m.original}→${m.replacement}`)).toEqual(['<→<=', '>=→>'])
    // tier 1 попереду за сортуванням
    expect(mutants[0].mutantType).toBe('ConditionalExpression')
  })

  test('tier 2 logical: && → ||, зняття негації !', () => {
    const src = 'export const ok = a && !b\n'
    const mutants = generateMutants('a.js', src, allLines(2))
    expect(mutants.some(m => m.mutantType === 'LogicalOperator' && m.replacement === '||')).toBe(true)
    const neg = mutants.find(m => m.mutantType === 'BooleanNegation')
    expect(neg.original).toBe('!')
    expect(neg.replacement).toBe('')
  })

  test('tier 3 equality: === → !==', () => {
    const src = 'export const eq = a === b\n'
    const mutants = generateMutants('a.js', src, allLines(2))
    expect(mutants.some(m => m.mutantType === 'EqualityOperator' && m.replacement === '!==')).toBe(true)
  })

  test('tier 4: BooleanLiteral і ReturnValue → null', () => {
    const src = 'export function f() {\n  const on = true\n  return on\n}\n'
    const mutants = generateMutants('a.js', src, allLines(5))
    expect(mutants.some(m => m.mutantType === 'BooleanLiteral' && m.original === 'true')).toBe(true)
    const ret = mutants.find(m => m.mutantType === 'ReturnValue')
    expect(ret.original).toBe('on')
    expect(ret.replacement).toBe('null')
  })

  test('tier 5 arithmetic: - → +, але + НЕ мутується (string-concat шум)', () => {
    const src = 'export const d = a - b\nexport const s = a + b\n'
    const mutants = generateMutants('a.js', src, allLines(3))
    expect(mutants.some(m => m.mutantType === 'ArithmeticOperator' && m.original === '-')).toBe(true)
    expect(mutants.some(m => m.original === '+')).toBe(false)
  })

  test('фільтрує мутанти поза покритими рядками', () => {
    const src = 'export const a = x < 1\nexport const b = y < 2\n'
    const mutants = generateMutants('a.js', src, new Set([2]))
    expect(mutants).toHaveLength(1)
    expect(mutants[0].line).toBe(2)
  })

  test('.vue: мутує лише <script>-блок, line/col відносно ПОВНОГО файлу', () => {
    const src = '<template>\n  <div v-if="x < 5" />\n</template>\n<script setup>\nconst ok = a < b\n</script>\n'
    const mutants = generateMutants('Card.vue', src, allLines(10))
    // template `x < 5` НЕ мутується; script `a < b` — так, рядок 5
    expect(mutants).toHaveLength(1)
    expect(mutants[0].line).toBe(5)
    expect(mutants[0].original).toBe('<')
  })

  test('.vue з lang="ts" → 0 мутантів (parseAst не бере TS)', () => {
    const src = '<script setup lang="ts">\nconst x: number = a < b ? 1 : 2\n</script>\n'
    expect(generateMutants('Card.vue', src, allLines(5))).toEqual([])
  })

  test('.vue без <script>-блоку → 0 мутантів', () => {
    const src = '<template><div /></template>\n'
    expect(generateMutants('Card.vue', src, allLines(2))).toEqual([])
  })

  test('невалідний синтаксис → 0 мутантів (тихо)', () => {
    expect(generateMutants('a.js', 'const x: number = 1\n', allLines(2))).toEqual([])
  })
})

describe('runStorybookMutation — mutate→run→restore', () => {
  const SRC = 'export function f(x) {\n  return x < 5\n}\n'

  test('killed (exit ≠ 0) і survived (exit 0) рахуються; файл відновлено', () => {
    const dir = makeRoot('src/a.js', SRC)
    const seen = []
    const result = runStorybookMutation({
      jsRoot: dir,
      files: ['src/a.js'],
      coveredLines: new Map([['src/a.js', new Set([2])]]),
      runMutantTest: ({ cwd }) => {
        seen.push(readFileSync(join(cwd, 'src/a.js'), 'utf8'))
        return seen.length === 1 ? 1 : 0 // перший killed, решта survived
      }
    })
    // під час прогону файл був мутований…
    expect(seen[0]).not.toBe(SRC)
    // …а після — відновлений
    expect(readFileSync(join(dir, 'src/a.js'), 'utf8')).toBe(SRC)
    expect(result.caught).toBe(1)
    expect(result.total).toBe(seen.length)
    expect(result.survived[0].file).toBe('src/a.js')
    expect(result.survived[0].mutants.length).toBe(result.total - 1)
    rmSync(dir, { recursive: true, force: true })
  })

  test('timeout (status null) рахується як caught, не survived', () => {
    const dir = makeRoot('src/a.js', SRC)
    const result = runStorybookMutation({
      jsRoot: dir,
      files: ['src/a.js'],
      coveredLines: new Map([['src/a.js', new Set([2])]]),
      runMutantTest: () => null
    })
    expect(result.caught).toBe(result.total)
    expect(result.survived).toEqual([])
    rmSync(dir, { recursive: true, force: true })
  })

  test('файл відновлюється навіть коли runMutantTest кидає', () => {
    const dir = makeRoot('src/a.js', SRC)
    expect(() =>
      runStorybookMutation({
        jsRoot: dir,
        files: ['src/a.js'],
        coveredLines: new Map([['src/a.js', new Set([2])]]),
        runMutantTest: () => {
          throw new Error('boom')
        }
      })
    ).toThrow('boom')
    expect(readFileSync(join(dir, 'src/a.js'), 'utf8')).toBe(SRC)
    rmSync(dir, { recursive: true, force: true })
  })

  test('maxPerFile і maxTotal обмежують кількість прогонів', () => {
    // 4 boundary-мутанти на покритих рядках
    const src = 'export const a = w < 1\nexport const b = x < 2\nexport const c = y < 3\nexport const d = z < 4\n'
    const dir = makeRoot('src/a.js', src)
    let runs = 0
    const result = runStorybookMutation({
      jsRoot: dir,
      files: ['src/a.js'],
      coveredLines: new Map([['src/a.js', new Set([1, 2, 3, 4])]]),
      runMutantTest: () => {
        runs++
        return 1
      },
      maxPerFile: 2,
      maxTotal: 10
    })
    expect(runs).toBe(2)
    expect(result.total).toBe(2)
    rmSync(dir, { recursive: true, force: true })
  })

  test('maxTotal ділиться між файлами (другий файл отримує залишок)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sb-mut-multi-'))
    mkdirSync(join(dir, 'src'), { recursive: true })
    writeFileSync(join(dir, 'src', 'a.js'), 'export const a = x < 1\nexport const b = y < 2\n')
    writeFileSync(join(dir, 'src', 'b.js'), 'export const c = z < 3\nexport const d = q < 4\n')
    let runs = 0
    runStorybookMutation({
      jsRoot: dir,
      files: ['src/a.js', 'src/b.js'],
      coveredLines: new Map([
        ['src/a.js', new Set([1, 2])],
        ['src/b.js', new Set([1, 2])]
      ]),
      runMutantTest: () => {
        runs++
        return 1
      },
      maxPerFile: 2,
      maxTotal: 3
    })
    expect(runs).toBe(3) // 2 з a.js + 1 з b.js
    rmSync(dir, { recursive: true, force: true })
  })

  test('файли без покриття/без мутантів пропускаються без прогонів', () => {
    const dir = makeRoot('src/a.js', 'export const a = 1\n') // нема мутабельних вузлів
    let runs = 0
    const result = runStorybookMutation({
      jsRoot: dir,
      files: ['src/a.js', 'src/missing.js'],
      coveredLines: new Map([['src/a.js', new Set([1])]]),
      runMutantTest: () => {
        runs++
        return 1
      }
    })
    expect(runs).toBe(0)
    expect(result).toEqual({ caught: 0, total: 0, survived: [] })
    rmSync(dir, { recursive: true, force: true })
  })

  test('resolveStoryFilter прокидається у runMutantTest', () => {
    const dir = makeRoot('src/a.js', SRC)
    const filters = []
    runStorybookMutation({
      jsRoot: dir,
      files: ['src/a.js'],
      coveredLines: new Map([['src/a.js', new Set([2])]]),
      runMutantTest: ({ storyFilter }) => {
        filters.push(storyFilter)
        return 1
      },
      resolveStoryFilter: () => 'src/a.stories.js'
    })
    expect(filters.every(f => f === 'src/a.stories.js')).toBe(true)
    rmSync(dir, { recursive: true, force: true })
  })
})
