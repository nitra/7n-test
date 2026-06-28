/**
 * Main auto-test loop: coverage → gen-tests → loop until max → mutation + fix.
 *
 * Phase 1 (loop, max 5 iterations):
 *   1. Measure per-file line coverage via vitest+lcov.
 *   2. Generate tests for all files below threshold — coverage % is the signal.
 *   3. Bootstrap: when no tests exist, scan sources and quickClassify locally.
 *   4. Repeat until coverage maxes out or no improvement.
 *
 * Phase 2:
 *   5. Mutation testing via existing coverage providers (requires .n-cursor.json#rules).
 *   6. Auto-fix survived mutants via pi agent.
 */
import { measureCoveragePerFile, getUncoveredFiles, findSourceFiles } from './coverage-per-file.mjs'
import { quickClassify } from './assess-need.mjs'
import { generateTests } from './gen-tests.mjs'
import { fixFailingTests } from './fix-tests.mjs'
import { runCoverageSteps } from './coverage/coverage.mjs'
import { withLock } from './scripts/utils/with-lock.mjs'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const MAX_ITERATIONS = 5
const COVERAGE_THRESHOLD = 80

/**
 * @param {string} dir absolute path to project root
 * @param {{ noMutation?: boolean }} [opts]
 * @returns {Promise<number>} exit code
 */
export async function runAutoTest(dir, opts = {}) {
  console.log(`\n📁 ${dir}\n`)

  let prevUncoveredCount = Infinity

  for (let i = 1; i <= MAX_ITERATIONS; i++) {
    console.log(`\n── Ітерація ${i}/${MAX_ITERATIONS}: coverage ──\n`)

    const { files: allFiles, failingTests } = await measureCoveragePerFile(dir)

    if (failingTests.length > 0) {
      console.log(`\n── ${failingTests.length} тестів падають — виправляю (pi agent) ──\n`)
      const { remaining } = await fixFailingTests(dir, { failures: failingTests })
      if (remaining === 0) continue
    }

    if (allFiles.length === 0) {
      if (failingTests.length > 0) {
        console.log('⚠ Тести падають, але coverage все одно порожня — зупиняю цикл.')
        break
      }
      // Bootstrap: no tests at all — scan source files and generate initial tests
      const sourceFiles = await findSourceFiles(dir)
      if (sourceFiles.length === 0) {
        console.log('⚠ Vitest coverage не повернула даних — перевір налаштування vitest.')
        break
      }
      console.log(`\n── Bootstrap: ${sourceFiles.length} джерел — класифікую локально ──\n`)

      const bootstrapFiles = sourceFiles
        .map(f => {
          try {
            const q = quickClassify(readFileSync(join(dir, f), 'utf8'))
            if (q?.needsTests === false) return null
          } catch {
            /* include on read error */
          }
          return { file: f, pct: 0 }
        })
        .filter(Boolean)

      if (bootstrapFiles.length === 0) {
        console.log('✓ Жоден файл не потребує unit-тестів (реекспорти/типи).')
        break
      }

      console.log(`\n→ Bootstrap-тести для (${bootstrapFiles.length}):`)
      for (const f of bootstrapFiles) console.log(`  • ${f.file}`)
      await generateTests(bootstrapFiles, dir)
      continue
    }

    const uncovered = getUncoveredFiles(allFiles, COVERAGE_THRESHOLD)
    const covered = allFiles.length - uncovered.length
    const pct = ((covered / allFiles.length) * 100).toFixed(1)

    console.log(`\n✓ Покриття: ${pct}% файлів (${covered}/${allFiles.length})`)

    if (uncovered.length === 0) {
      console.log('✓ Всі файли мають достатнє покриття — переходжу до мутантів.')
      break
    }

    if (uncovered.length >= prevUncoveredCount) {
      console.log('⚠ Покриття не покращилось після генерації тестів — зупиняю цикл.')
      break
    }
    prevUncoveredCount = uncovered.length

    console.log(`\n→ Генерую тести для ${uncovered.length} файлів:`)
    for (const f of uncovered) {
      console.log(`  • ${f.file} (${f.pct.toFixed(1)}%)`)
    }

    await generateTests(uncovered, dir)
  }

  if (opts.noMutation) {
    console.log('\n── Мутаційне тестування пропущено (--no-mutation) ──\n')
    return 0
  }

  console.log('\n── Мутаційне тестування + автофікс ──\n')
  const code = await withLock('coverage', () => runCoverageSteps({ fix: true, cwd: dir }))
  if (code === 0) {
    console.log('\n♻️  Повторний coverage після агента...\n')
    return withLock('coverage', () => runCoverageSteps({ fix: false, cwd: dir }))
  }
  return code
}
