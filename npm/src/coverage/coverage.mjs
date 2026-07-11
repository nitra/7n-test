/**
 * Канонічна команда `@7n/test coverage`: збирає метрики покриття + мутаційного
 * тестування через вбудований JS-колектор (`js-collector.mjs`), агрегує та
 * записує COVERAGE.md у корінь проєкту.
 *
 * Самодостатній — не залежить від `@nitra/cursor` (раніше — provider-discovery
 * за `.n-cursor.json#rules` через `<rulesDir>/<ruleId>/coverage/coverage.mjs`;
 * provider-підсистема видалена з `@nitra/cursor` 2026-07-10, лишаючи оркестратор
 * без жодного провайдера). Наразі підтримується лише JS/TS (`js-collector.mjs`);
 * інші мови (Rust тощо) — не покриті, до появи власного колектора тут.
 *
 * Лок — прямий виклик `withLock('coverage', steps)`.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { applyVerdicts } from '../coverage-classify/apply.mjs'
import { classify } from '../coverage-classify/index.mjs'
import { collectChangedFilesSince, resolveChangedBase } from '../scripts/lib/changed-files.mjs'
import { withLock } from '../scripts/utils/with-lock.mjs'
import { addCoverage, addMutation } from './aggregate.mjs'
import { collect as collectJs, detect as detectJs } from './js-collector.mjs'

export { addCoverage, addMutation }

/**
 * Форматує covered/total як `XX.XX% (covered/total)`.
 * @param {{covered:number,total:number}} metric метрика lines або functions
 * @returns {string} відформатований рядок для таблиці COVERAGE.md
 */
export function formatCoverage({ covered, total }) {
  const percent = total === 0 ? '—' : `${((covered / total) * 100).toFixed(2)}%`
  return `${percent} (${covered}/${total})`
}

/**
 * Форматує мутаційний score як `XX.XX%`.
 * @param {{caught:number,total:number}} metric агрегований mutation score
 * @returns {string} відформатований score або прочерк
 */
export function formatScore({ caught, total }) {
  return total === 0 ? '—' : `${((caught / total) * 100).toFixed(2)}%`
}

/**
 * Рендерить таблицю покриття + мутаційного тестування як Markdown.
 * Якщо будь-який рядок містить непустий `survived`, додає секцію
 * `## Вцілілі мутанти` з JSON-блоком для coverage-fix.
 * Якщо `allowedGaps` непустий, додає секцію `## Allowed gaps` з таблицею
 * verdict/confidence/reason для кожного LLM-класифікованого мутанта.
 * Без timestamp, щоб git diff рухався лише при зміні метрик.
 * @param {Array<{area:string, coverage:{lines:{covered:number,total:number},functions:{covered:number,total:number}}, mutation:{caught:number,total:number}, survived?: Array<{file:string,line:number,col:number,mutantType:string,original:string,replacement:string}>}>} rows рядки провайдерів
 * @param {Array<{file:string, mutant:{line:number,col:number,mutantType:string,original:string,replacement:string}, verdict:{verdict:string,confidence:number,reason:string}}>} [allowedGaps] мутанти виключені класифікатором
 * @returns {string} Markdown з заголовком `# Coverage`
 */
export function renderMarkdown(rows, allowedGaps = []) {
  const lines = [
    '# Coverage',
    '',
    '| Область | Рядки | Функції | Вбито мутацій | Score |',
    '| --- | --- | --- | --- | --- |'
  ]
  for (const row of rows) {
    lines.push(
      `| ${row.area} | ${formatCoverage(row.coverage.lines)} | ${formatCoverage(row.coverage.functions)} | ` +
        `${row.mutation.caught}/${row.mutation.total} | ${formatScore(row.mutation)} |`
    )
  }

  const allSurvived = rows.flatMap(r => r.survived ?? [])
  if (allSurvived.length > 0) {
    lines.push('', '## Вцілілі мутанти', '', '```json', JSON.stringify(allSurvived, null, 2), '```')
    // Зрозуміла для людини таблиця
    for (const group of allSurvived) {
      lines.push('', `### ${group.file}`, '', '| Рядок | Оригінал | Заміна | Тип |', '| --- | --- | --- | --- |')
      for (const m of group.mutants) {
        lines.push(`| ${m.line} | \`${m.original}\` | \`${m.replacement}\` | ${m.mutantType} |`)
      }
      if (group.exampleTest) {
        lines.push(
          '',
          `**Приклад тесту** (\`${group.exampleTest.testFile}\`):`,
          '',
          '```js',
          group.exampleTest.code ?? '',
          '```'
        )
      }
      if (group.recommendationText) {
        lines.push('', '**Що треба протестувати:**', '', group.recommendationText)
      }
    }
  }

  if (allowedGaps.length > 0) {
    // Group allowed gaps by file
    const gapsByFile = new Map()
    for (const gap of allowedGaps) {
      if (!gapsByFile.has(gap.file)) gapsByFile.set(gap.file, [])
      gapsByFile.get(gap.file).push(gap)
    }

    lines.push(
      '',
      '## Allowed gaps',
      '',
      `> LLM-класифікатор виключив ${allowedGaps.length} survived мутант(ів) зі знаменника mutation score.`,
      '> Категорії: equivalent (поведінково еквівалентний), defensive (impossible state), glue/wrapper (integration test покриває).'
    )

    for (const [file, gaps] of gapsByFile) {
      lines.push(
        '',
        `### ${file}`,
        '',
        '| Line | Mutant | Verdict | Confidence | Reason |',
        '| --- | --- | --- | --- | --- |'
      )
      for (const { mutant, verdict } of gaps) {
        const sanitizedReason = verdict.reason.replaceAll('|', String.raw`\|`).replaceAll('\n', ' ')
        lines.push(
          `| ${mutant.line} | \`${mutant.original}\` → \`${mutant.replacement}\` | ${verdict.verdict} | ${verdict.confidence.toFixed(2)} | ${sanitizedReason} |`
        )
      }
    }
  }

  return `${lines.join('\n')}\n`
}

/**
 * Будує підсумковий рядок «Разом» через сумування всіх coverage/mutation.
 * @param {Array<{area:string, coverage:object, mutation:object}>} rows рядки провайдерів без totals
 * @returns {{area:string, coverage:object, mutation:{caught:number,total:number}}} агрегований рядок «Разом»
 */
function buildTotalsRow(rows) {
  let totalCoverage = { lines: { covered: 0, total: 0 }, functions: { covered: 0, total: 0 } }
  let totalMutation = { caught: 0, total: 0 }
  for (const row of rows) {
    totalCoverage = addCoverage(totalCoverage, row.coverage)
    totalMutation = addMutation(totalMutation, row.mutation)
  }
  return { area: '**Разом**', coverage: totalCoverage, mutation: totalMutation }
}

/**
 * Читає `.n-cursor.json#coverage.classifyConfidenceThreshold` (default 1.1 — rollout mode).
 * @param {string} cwd корінь проєкту
 * @returns {Promise<number>} threshold у [0, 1.1]
 */
async function readClassifyThreshold(cwd) {
  try {
    const raw = await readFile(join(cwd, '.n-cursor.json'), 'utf8')
    const parsed = JSON.parse(raw)
    const t = parsed?.coverage?.classifyConfidenceThreshold
    return typeof t === 'number' && Number.isFinite(t) ? t : 1.1
  } catch {
    return 1.1
  }
}

/**
 * Резолвить scope змінених файлів для `--changed`-режиму.
 * @param {string} cwd корінь проєкту
 * @returns {{base: string|null, files: string[]}} base-ref і relative-posix список змінених файлів
 */
export function resolveChangedScope(cwd) {
  const base = resolveChangedBase(cwd)
  return { base, files: collectChangedFilesSince(base, cwd) }
}

/**
 * Виконує coverage-pipeline: JS-колектор (detect+collect), агрегація, запис COVERAGE.md.
 * @param {{cwd?:string, fix?:boolean, changed?:boolean}} [opts]
 * @returns {Promise<number>} exit code (0 OK, 1 помилка)
 */
export async function runCoverageSteps(opts = {}) {
  const cwd = opts.cwd ?? process.cwd()
  const scope = opts.changed ? resolveChangedScope(cwd) : null
  const collectOpts = scope ? { changedFiles: scope.files, base: scope.base } : {}

  const applicable = await detectJs(cwd)
  const rows = applicable ? await collectJs(cwd, collectOpts) : []

  if (rows.length === 0) {
    if (opts.changed) {
      console.log('✓ coverage --changed: немає змінених файлів у scope — пропускаю')
      return 0
    }
    console.error('✗ Coverage: не знайдено тестів (vitest не задекларовано, або жоден workspace не має тестів)')
    return 1
  }

  if (opts.changed) {
    console.log('✓ coverage --changed: змінені файли перевірено')
    return 0
  }

  // LLM-класифікація survived мутантів (graceful skip без API key)
  const allSurvived = rows.flatMap(r => r.survived ?? [])
  let augmentedRows = rows
  let allowedGaps = []
  if (allSurvived.length > 0) {
    const verdicts = await classify(allSurvived, cwd)
    if (verdicts.length > 0) {
      const threshold = await readClassifyThreshold(cwd)
      const applied = applyVerdicts(rows, verdicts, threshold)
      augmentedRows = applied.rows
      allowedGaps = applied.allowedGaps
    }
  }

  if (augmentedRows.filter(r => r.area !== '**Разом**').length > 1) {
    augmentedRows.push(buildTotalsRow(augmentedRows.filter(r => r.area !== '**Разом**')))
  }
  const md = renderMarkdown(augmentedRows, allowedGaps)
  // Stryker disable next-line StringLiteral: equivalent – writeFile(path, str, '') behaves identically to 'utf8' in Node/Bun
  await writeFile(join(cwd, 'COVERAGE.md'), md, 'utf8')
  console.log('✓ COVERAGE.md')

  if (opts.fix) {
    const { fixSurvivedMutants } = await import(new URL('../coverage-fix.mjs', import.meta.url).href)
    await fixSurvivedMutants(allSurvived, cwd)
  }

  return 0
}

/**
 * Ключ локу/дедупу для `withLock`. `--changed` і full-режим виконують принципово різну
 * роботу (changed ніколи не пише COVERAGE.md) — спільний ключ дозволив би успішному
 * `--changed`-прогону (exitCode 0, той самий fingerprint дерева) дедуплікувати наступний
 * full-прогін, і COVERAGE.md ніколи б не записався.
 * @param {boolean} [changed] чи `--changed`-режим
 * @returns {string} ключ локу
 */
function lockKey(changed) {
  return changed ? 'coverage-changed' : 'coverage'
}

/**
 * CLI entrypoint для `@7n/test coverage [--fix] [--changed]`.
 * @param {{cwd?:string, fix?:boolean, changed?:boolean}} [opts]
 * @returns {Promise<number>} exit code
 */
export async function runCoverageCli(opts = {}) {
  const code = await withLock(lockKey(opts.changed), () => runCoverageSteps(opts))
  if (code === 0 && opts.fix) {
    console.log('\n♻️  Повторний coverage після агента…\n')
    return withLock(lockKey(opts.changed), () => runCoverageSteps({ cwd: opts.cwd, fix: false, changed: opts.changed }))
  }
  return code
}
