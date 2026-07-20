/**
 * `n coverage --fix`: запускає pi-агента для написання тестів
 * по вцілілих мутантах Stryker. Агент отримує список мутантів з контекстом
 * (file, line, оригінальний код, вцілілий варіант, тип мутації) і самостійно
 * знаходить або створює відповідні test-файли.
 *
 * Модель: CLOUD_MAX (складна агентна задача) або N_CURSOR_COVERAGE_FIX_MODEL.
 */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { env } from 'node:process'
import { CLOUD_MAX } from '@7n/llm-lib/model-tiers'
import { callAgent } from './lib/llm.mjs'

const MODEL = env.N_CURSOR_COVERAGE_FIX_MODEL ?? CLOUD_MAX

/**
 * Дефолтна стеля мутантів на один batch (один агентний виклик зі своїм `AGENT_TIMEOUT_MS`
 * вікном). Один величезний промпт на весь проєкт (сотні мутантів) впирався у 15-хвилинний
 * timeout `callAgent` — поділ на батчі тримає кожен виклик у розумних часових межах і дозволяє
 * прогресу бути інкрементальним: провал одного batch не блокує решту файлів.
 * Override: `N_CURSOR_COVERAGE_FIX_BATCH_MUTANTS`.
 */
const DEFAULT_BATCH_MUTANT_BUDGET = 40

/**
 * @typedef {{line:number, col:number, mutantType:string, original:string, replacement:string}} MutantDetail
 * @typedef {{file:string, mutants:MutantDetail[], exampleTest:{testFile:string,code:string|null}|null, recommendationText:string|null}} SurvivedFileGroup
 */

/**
 * Читає стелю мутантів на batch з env (з дефолтом), для CLI-конфігурації на великих проєктах.
 * @returns {number} стеля мутантів на один batch
 */
function resolveBatchBudget() {
  const n = Number(env.N_CURSOR_COVERAGE_FIX_BATCH_MUTANTS)
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_BATCH_MUTANT_BUDGET
}

/**
 * Ділить групи вцілілих мутантів на batches, кожен у межах `budget` мутантів сумарно —
 * жадібне пакування у порядку вхідного масиву. Файл ніколи не ріжеться навпіл (мутанти
 * одного файлу завжди в одному batch, навіть якщо сам файл перевищує budget) — узгодженість
 * контексту для агента важливіша за точне дотримання стелі.
 * @param {SurvivedFileGroup[]} survived вцілілі мутанти, згруповані по файлах
 * @param {number} budget стеля мутантів на batch
 * @returns {SurvivedFileGroup[][]} batches (кожен — підмножина `survived`)
 */
export function batchSurvived(survived, budget) {
  const batches = []
  let current = []
  let currentCount = 0
  for (const group of survived) {
    if (current.length > 0 && currentCount + group.mutants.length > budget) {
      batches.push(current)
      current = []
      currentCount = 0
    }
    current.push(group)
    currentCount += group.mutants.length
  }
  if (current.length > 0) batches.push(current)
  return batches
}

/**
 * Запускає pi-агента для написання тестів по вцілілих мутантах — по batches, кожен
 * своїм агентним викликом. Помилка одного batch (напр. timeout) не зупиняє решту:
 * ловиться, логується з переліком файлів batch (можливий частковий прогрес на диску —
 * агент пише файли напряму, до кидання помилки), і прогін продовжується наступним batch.
 * @param {SurvivedFileGroup[]} survived вцілілі мутанти, згруповані по файлах
 * @param {string} projectRoot абсолютний шлях до кореня проєкту
 * @param {{ callPi?: (prompt: string, model: string, opts: { cwd: string }) => Promise<void> }} [opts] ін'єкції для тестів
 * @returns {Promise<{fixed: string[], failed: {files: string[], error: string}[]}>} файли за batches, що завершились успішно/помилкою
 */
export async function fixSurvivedMutants(survived, projectRoot, opts = {}) {
  const totalMutants = survived.reduce((s, g) => s + g.mutants.length, 0)
  if (totalMutants === 0) {
    console.log('✓ Всі мутанти вбиті — доповнення тестів не потрібне')
    return { fixed: [], failed: [] }
  }

  const batches = batchSurvived(survived, resolveBatchBudget())
  const callPiFn = opts.callPi ?? callPi
  console.log(
    `\n🤖 coverage --fix: ${totalMutants} вцілілих мутантів, ${survived.length} файл(ів) → ${batches.length} batch(ів)...\n`
  )

  const fixed = []
  const failed = []
  for (const [i, batch] of batches.entries()) {
    const files = batch.map(g => g.file)
    const batchMutants = batch.reduce((s, g) => s + g.mutants.length, 0)
    console.log(
      `\n🤖 batch ${i + 1}/${batches.length}: ${files.length} файл(ів), ${batchMutants} мутантів — ${files.join(', ')}\n`
    )

    const prompt = await buildFixPrompt(batch, projectRoot)
    try {
      await callPiFn(prompt, MODEL, { cwd: projectRoot })
      fixed.push(...files)
    } catch (error) {
      console.error(`✗ batch ${i + 1}/${batches.length} не завершився: ${error.message}`)
      console.error(`  Файли batch (можливий частковий прогрес на диску — перевір git status): ${files.join(', ')}`)
      failed.push({ files, error: error.message })
    }
  }

  if (failed.length > 0) {
    console.log(`\n⚠️  coverage --fix: ${fixed.length} файл(ів) успішно, ${failed.length} batch(ів) з помилкою:`)
    for (const f of failed) console.log(`  ✗ ${f.files.join(', ')} — ${f.error}`)
  } else {
    console.log(`\n✓ coverage --fix: усі ${batches.length} batch(ів) завершено (${fixed.length} файл(ів)).`)
  }

  return { fixed, failed }
}

/**
 * Викликає агента через `@7n/llm-lib` (SDK-embed, live-output до stdout) —
 * заміна колишнього spawnSync pi CLI.
 * @param {string} prompt текст промпта
 * @param {string} model  provider/model-id або '' для pi-дефолту
 * @param {{ cwd?: string }} [piOpts] опційні параметри (cwd)
 * @returns {Promise<void>} завершується після виконання агента
 */
function callPi(prompt, model, { cwd } = {}) {
  return callAgent(prompt, cwd, { model })
}

/**
 * Формує rich-промпт для агента: список вцілілих мутантів згрупований по файлах,
 * з контекстом ±3 рядки навколо кожного мутанта з source-файлу.
 * @param {SurvivedFileGroup[]} survived групи вцілілих мутантів по файлах
 * @param {string} projectRoot корінь проєкту
 * @returns {Promise<string>} текст rich-промпту
 */
export async function buildFixPrompt(survived, projectRoot) {
  const sections = []

  for (const { file, mutants, exampleTest } of survived) {
    let srcLines = []
    try {
      const src = await readFile(join(projectRoot, file), 'utf8')
      srcLines = src.split('\n')
    } catch {
      // файл може бути недоступним — пропускаємо контекст, але продовжуємо
    }

    const mutantDescriptions = mutants
      .map(m => {
        const ctxStart = Math.max(0, m.line - 4)
        const ctxEnd = Math.min(srcLines.length, m.line + 3)
        const context = srcLines
          .slice(ctxStart, ctxEnd)
          .map((l, i) => `${ctxStart + i + 1}: ${l}`)
          .join('\n')
        return [
          `  - Рядок ${m.line}, колонка ${m.col}, тип мутації \`${m.mutantType}\``,
          `    Оригінал: \`${m.original}\``,
          `    Вижив варіант: \`${m.replacement}\``,
          context ? `    Контекст:\n\`\`\`\n${context}\n\`\`\`` : ''
        ]
          .filter(Boolean)
          .join('\n')
      })
      .join('\n')

    const exampleSection = exampleTest?.code
      ? `\n\nПриклад тесту з \`${exampleTest.testFile}\`:\n\`\`\`js\n${exampleTest.code}\n\`\`\``
      : ''

    sections.push(`### \`${file}\`${exampleSection}\n${mutantDescriptions}`)
  }

  return [
    'Твоє завдання — написати unit-тести, що вбивають наступні вцілілі мутанти Stryker.',
    'Для кожного мутанта: знайди або створи відповідний test-файл, додай тест-кейс,',
    'що явно перевіряє цю гілку/умову і провалиться якщо код замінити на "вцілілий варіант".',
    '',
    '## Вцілілі мутанти',
    '',
    ...sections,
    '',
    '## Правила',
    '- Не змінюй source-файли — лише test-файли.',
    '- Використовуй той самий test-фреймворк, що вже в проєкті.',
    '- Запусти `bun test` (або відповідну команду) після кожного файлу — переконайся, що 0 fail.',
    '- Якщо мутант охоплений іншим новим тестом — не дублюй.'
  ].join('\n')
}
