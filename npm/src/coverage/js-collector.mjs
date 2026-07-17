/**
 * Самодостатній JS/TS coverage + mutation-testing колектор: збирає метрики покриття
 * (`vitest run --coverage`) і мутаційного тестування (Stryker з vitest-runner + perTest).
 * Не залежить від `@nitra/cursor` — раніше жив там як rule-провайдер
 * (`rules/js/coverage/coverage.mjs`), видалений разом з усією provider-підсистемою
 * (2026-07-10). Тепер — вбудований collector `@7n/test coverage`.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, isAbsolute, join, relative } from 'node:path'

import { resolveAllJsRoots } from '../lib/resolve-js-root.mjs'
import { addCoverage, addMutation } from './aggregate.mjs'
import { hasRunnableTests, isBunNativeRoot } from './bun-native.mjs'
import { STORIES_FILE_RE, hasStories, isStorybookRoot } from './storybook.mjs'

const TEST_BLOCK_START = /^\s*(it|test)\(/
const FILE_EXTENSION = /\.[^.]+$/
/**
 * JS/TS/Vue-розширення — файли, які мутує Stryker і покриває vitest. `.vue` включено:
 * Stryker core мутує `<script>`/`<script setup>` блок SFC без окремого плагіна (з версії 7+).
 * Мутувати можна лише те, що покрите НЕ-browser-mode тестами (`@vue/test-utils`+happy-dom
 * тощо), НЕ Storybook-сторі (`@storybook/addon-vitest`, browser mode) — детальніше про чому
 * див. коментар над `collectStorybookForRoot` нижче.
 */
const JS_FILE = /\.(c|m)?[jt]sx?$|\.vue$/
/** Тест-файли (`*.test.*` / `*.spec.*`) — НЕ production-код, не йдуть у Stryker `--mutate`. */
const TEST_FILE = /\.(test|spec)\.[^.]+$/
/** `.vue`-компоненти + `*.stories.*` — сигнал для Storybook-змінного scope (line coverage). */
const VUE_OR_STORIES_FILE = /\.vue$|\.stories\.[^.]+$/

/**
 * Звужує список змінених файлів (relative до cwd) до тих, що лежать під `jsRoot`,
 * мають JS/TS-розширення, і рібейзить їх відносно `jsRoot`.
 * @param {string[]} changedFiles relative-до-cwd шляхи змінених файлів
 * @param {string} cwd корінь проєкту
 * @param {string} jsRoot абсолютний шлях workspace-кореня
 * @returns {string[]} JS-файли під jsRoot, шляхи relative до jsRoot
 */
export function scopeToRoot(changedFiles, cwd, jsRoot) {
  const out = []
  for (const f of changedFiles) {
    if (!JS_FILE.test(f)) continue
    const rel = relative(jsRoot, join(cwd, f))
    if (rel.startsWith('..') || isAbsolute(rel)) continue
    out.push(rel)
  }
  return out
}

/**
 * Звужує список змінених файлів до тих, що стосуються Storybook-покриття
 * (`.vue`-компоненти + `*.stories.*`) під `jsRoot`, рібейзить відносно `jsRoot`.
 * Окремий від `scopeToRoot`: `.vue`/`*.stories.*` НЕ йдуть у Stryker `--mutate`
 * (JS-мутація для Vue поза скоупом), тож не змішуємо scope-и.
 * @param {string[]} changedFiles relative-до-cwd шляхи змінених файлів
 * @param {string} cwd корінь проєкту
 * @param {string} jsRoot абсолютний шлях workspace-кореня
 * @returns {string[]} `.vue`/`.stories.*`-файли під jsRoot, шляхи relative до jsRoot
 */
export function scopeToStorybookRoot(changedFiles, cwd, jsRoot) {
  const out = []
  for (const f of changedFiles) {
    if (!VUE_OR_STORIES_FILE.test(f)) continue
    const rel = relative(jsRoot, join(cwd, f))
    if (rel.startsWith('..') || isAbsolute(rel)) continue
    out.push(rel)
  }
  return out
}

const VITEST_HINT =
  'js coverage: vitest відсутній у package.json — додай `vitest`, `@vitest/coverage-v8` та `@stryker-mutator/vitest-runner` у devDependencies (див. test.mdc)'

/**
 * Чи у пакеті встановлено vitest (через dependencies або devDependencies).
 * @param {{dependencies?: Record<string,string>, devDependencies?: Record<string,string>}} pkg package.json
 * @returns {boolean} true, якщо `vitest` декларовано хоча б в одному dep-section
 */
function hasVitestDep(pkg) {
  return Boolean(pkg.devDependencies?.vitest) || Boolean(pkg.dependencies?.vitest)
}

/**
 * Чи колектор застосовний у поточному cwd. Активується, коли `vitest`
 * декларовано хоча б в одному JS-root АБО у кореневому `package.json`
 * (workspace-проєкт із hoisted node_modules — типовий патерн bun monorepo).
 * Інакше silent skip із hint у stderr (одноразово).
 * @param {string} cwd корінь проєкту
 * @returns {Promise<boolean>} true, якщо проєкт сумісний з vitest-based coverage
 */
export async function detect(cwd) {
  const jsRoots = await resolveAllJsRoots(cwd)
  if (jsRoots.length === 0) return false
  for (const jsRoot of jsRoots) {
    const pkgPath = join(jsRoot, 'package.json')
    if (!existsSync(pkgPath)) continue
    const pkg = JSON.parse(await readFile(pkgPath, 'utf8'))
    if (hasVitestDep(pkg)) return true
  }
  const rootInJsRoots = jsRoots.includes(cwd)
  if (!rootInJsRoots) {
    const rootPkgPath = join(cwd, 'package.json')
    if (existsSync(rootPkgPath)) {
      const rootPkg = JSON.parse(await readFile(rootPkgPath, 'utf8'))
      if (hasVitestDep(rootPkg)) return true
    }
  }
  if (!detect._hinted) {
    console.error(VITEST_HINT)
    detect._hinted = true
  }
  return false
}

/**
 * Парс lcov.info: сумує LF/LH (рядки) і FNF/FNH (функції) по всіх records.
 * @param {string} text вміст lcov.info
 * @returns {{lines:{covered:number,total:number}, functions:{covered:number,total:number}}} агреговані totals
 */
function parseLcov(text) {
  const acc = { lines: { covered: 0, total: 0 }, functions: { covered: 0, total: 0 } }
  for (const line of text.split('\n')) {
    if (line.startsWith('LF:')) acc.lines.total += Number(line.slice(3))
    else if (line.startsWith('LH:')) acc.lines.covered += Number(line.slice(3))
    else if (line.startsWith('FNF:')) acc.functions.total += Number(line.slice(4))
    else if (line.startsWith('FNH:')) acc.functions.covered += Number(line.slice(4))
  }
  return acc
}

/**
 * Витягує оригінальний фрагмент коду з рядків файлу за позицією мутанта.
 * @param {string[]} fileLines рядки файлу (0-indexed)
 * @param {{start:{line:number,column:number},end:{line:number,column:number}}} loc позиція (рядки 1-indexed)
 * @returns {string} оригінальний текст мутанта
 */
function extractOriginal(fileLines, loc) {
  const startLine = loc.start.line - 1
  const endLine = loc.end.line - 1
  if (startLine === endLine) {
    return fileLines[startLine]?.slice(loc.start.column, loc.end.column) ?? ''
  }
  const parts = []
  for (let i = startLine; i <= endLine; i++) {
    const line = fileLines[i] ?? ''
    if (i === startLine) parts.push(line.slice(loc.start.column))
    else if (i === endLine) parts.push(line.slice(0, loc.end.column))
    else parts.push(line)
  }
  return parts.join('\n')
}

/**
 * Витягує перший `it(` або `test(` блок з вмісту тест-файлу.
 * Відстежує глибину `{}` для коректного завершення.
 * @param {string} content вміст тест-файлу
 * @returns {string | null} перший тест-блок або null
 */
export function extractFirstTestBlock(content) {
  const lines = content.split('\n')
  let startLine = -1
  let depth = 0
  let inBlock = false
  const result = []
  for (const [i, line] of lines.entries()) {
    if (startLine === -1 && TEST_BLOCK_START.test(line)) startLine = i
    if (startLine === -1) continue
    result.push(line)
    for (const ch of line) {
      if (ch === '{') {
        depth++
        inBlock = true
      } else if (ch === '}') depth--
    }
    if (inBlock && depth === 0) break
  }
  return result.length > 0 ? result.join('\n') : null
}

/**
 * Шукає тест-файл для заданого source-файлу і повертає перший тест-блок як приклад стилю.
 * Кандидати: `<base>.test.js`, `<base>.test.mjs`, `<dir>/tests/<name>.test.js`.
 * @param {string} jsRoot абсолютний шлях до JS-кореня
 * @param {string} filename відносний шлях source-файлу (від jsRoot)
 * @returns {{testFile:string, code:string|null} | null} null — якщо тест-файл не знайдено
 */
export function findExampleTest(jsRoot, filename) {
  const base = filename.replace(FILE_EXTENSION, '')
  const candidates = [`${base}.test.js`, `${base}.test.mjs`, `${base}.test.ts`]
  const lastSlash = base.lastIndexOf('/')
  if (lastSlash !== -1) {
    const dir = base.slice(0, lastSlash)
    const name = base.slice(lastSlash + 1)
    candidates.push(`${dir}/tests/${name}.test.js`, `${dir}/tests/${name}.test.mjs`)
  }
  for (const rel of candidates) {
    const full = join(jsRoot, rel)
    if (!existsSync(full)) continue
    const content = readFileSync(full, 'utf8')
    return { testFile: rel, code: extractFirstTestBlock(content) }
  }
  return null
}

/**
 * Парс Stryker mutation.json: Killed+Timeout → caught; Survived+NoCoverage → до total.
 * Compile/Runtime помилки виключаються з total.
 * Survived мутанти групуються по файлах з exampleTest.
 * @param {{files:Record<string,{mutants:Array<{status:string,mutatorName?:string,replacement?:string,location?:{start:{line:number,column:number},end:{line:number,column:number}}}>}>}} report Stryker mutation.json
 * @param {string|null} [jsRoot] корінь для читання source-рядків і пошуку тест-файлів
 * @returns {{caught:number,total:number,survived:Array<{file:string,mutants:Array<{line:number,col:number,mutantType:string,original:string,replacement:string}>,exampleTest:{testFile:string,code:string|null}|null,recommendationText:string|null}>}} результат парсу: caught/total та згруповані survived мутанти
 */
export function parseStrykerReport(report, jsRoot) {
  let caught = 0
  let total = 0
  /** @type {Map<string, Array<{line:number,col:number,mutantType:string,original:string,replacement:string}>>} */
  const byFile = new Map()

  for (const [filePath, fileData] of Object.entries(report.files)) {
    let fileLines = null
    for (const mutant of fileData.mutants) {
      if (mutant.status === 'Killed' || mutant.status === 'Timeout') {
        caught += 1
        total += 1
      } else if (mutant.status === 'Survived' || mutant.status === 'NoCoverage') {
        total += 1
        if (mutant.status === 'Survived' && jsRoot && mutant.location) {
          if (!fileLines) {
            try {
              fileLines = readFileSync(join(jsRoot, filePath), 'utf8').split('\n')
            } catch {
              fileLines = []
            }
          }
          if (!byFile.has(filePath)) byFile.set(filePath, [])
          byFile.get(filePath).push({
            line: mutant.location.start.line,
            col: mutant.location.start.column,
            mutantType: mutant.mutatorName ?? 'Unknown',
            original: extractOriginal(fileLines, mutant.location),
            replacement: mutant.replacement ?? ''
          })
        }
      }
    }
  }

  const survived = []
  for (const [file, mutants] of byFile) {
    survived.push({
      file,
      mutants,
      exampleTest: jsRoot ? findExampleTest(jsRoot, file) : null,
      recommendationText: null
    })
  }

  return { caught, total, survived }
}

/**
 * Шлях до локально встановленого Stryker core-bin (поряд із плагінами на кшталт
 * `@stryker-mutator/vitest-runner`). Запуск саме його через `node` — не `npx`/`bunx` —
 * дає Stryker побачити локальні плагіни при plugin-discovery.
 * @returns {string | null} абсолютний шлях `bin/stryker.js` або `null`, якщо не встановлено
 */
let strykerBinCache

/**
 * Резолвить локальний Stryker core bin (мемоізовано).
 * @returns {string | null} абсолютний шлях `bin/stryker.js` або `null`
 */
function resolveLocalStrykerBin() {
  if (strykerBinCache !== undefined) return strykerBinCache
  try {
    // `exports` у core НЕ відкриває `./bin/stryker.js`, тож резолвимо package.json
    // (доступний) і беремо шлях bin звідти. Ключ bin зазвичай `stryker`; як запас —
    // перше значення map'и.
    const require = createRequire(import.meta.url)
    const pkgJsonPath = require.resolve('@stryker-mutator/core/package.json')
    const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'))
    const binRel = typeof pkg.bin === 'string' ? pkg.bin : (pkg.bin?.stryker ?? Object.values(pkg.bin ?? {})[0])
    strykerBinCache = binRel ? join(dirname(pkgJsonPath), binRel) : null
  } catch {
    strykerBinCache = null
  }
  return strykerBinCache
}

const defaultRunner = {
  runJsCoverage({ cwd, lcovDir, base, excludeStorybookProject }) {
    // base !== undefined ⇔ --changed-режим: vitest сам рахує зачеплені змінами тести
    // через граф імпортів. `--changed <base>` порівнює base↔робоче дерево (committed і
    // uncommitted разом); `--changed` без аргументу — uncommitted vs HEAD.
    const changedArgs = base === undefined ? [] : base === null ? ['--changed'] : ['--changed', base]
    // excludeStorybookProject: коли root — Storybook-workspace, named vitest-проєкт
    // "storybook" (browser mode, Playwright) типово живе у ТОМУ Ж vitest.config.mjs, що
    // й звичайний JS-suite (canonical setup @storybook/addon-vitest — projects: [...]).
    // Без --project=!storybook цей прогін спробував би виконати і browser-mode тести теж —
    // зайве дублювання з collectStorybookForRoot і ризик втягнути Playwright-залежність
    // у звичайний coverage-прогін.
    const projectArgs = excludeStorybookProject ? ['--project=!storybook'] : []
    const r = spawnSync(
      'bunx',
      [
        'vitest',
        'run',
        '--passWithNoTests',
        '--coverage',
        '--coverage.reporter=lcov',
        `--coverage.reportsDirectory=${lcovDir}`,
        ...projectArgs,
        ...changedArgs
      ],
      { cwd, stdio: 'inherit', env: process.env }
    )
    return r.status ?? 1
  },
  runBunCoverage({ cwd, lcovDir }) {
    // Bun-native workspace (prod-код імпортує `bun`/`bun:*`): vitest такий модуль не
    // резолвить, тож coverage ганяємо нативним `bun test`. Bun ремапить
    // `import ... from 'vitest'` у тест-файлах на `bun:test` — тести лишаються canon.
    // `--parallel` форкає worker-процес на тестовий файл (ізоляція module-registry):
    // без нього всі файли ділять один process, і leftover mock-стан
    // (`mockResolvedValueOnce`, module-level кеш) з одного файлу протікає в наступний,
    // даючи фантомні падіння. lcov з `--coverage-dir` агрегується коректно з усіх worker-ів.
    const r = spawnSync(
      'bun',
      ['test', '--coverage', '--coverage-reporter=lcov', `--coverage-dir=${lcovDir}`, '--parallel'],
      {
        cwd,
        stdio: 'inherit',
        env: process.env
      }
    )
    return r.status ?? 1
  },
  runStorybookCoverage({ cwd, lcovDir, base }) {
    // Coverage сторі рахує сам Storybook-vitest-addon (browser mode, Playwright Chromium)
    // через named vitest-проєкт "storybook" (канонічний vitest.config для Vue-проєктів,
    // див. npm/docs) — той самий контракт lcov, що й у звичайного vitest run --coverage.
    const changedArgs = base === undefined ? [] : base === null ? ['--changed'] : ['--changed', base]
    const r = spawnSync(
      'bunx',
      [
        'vitest',
        'run',
        '--project=storybook',
        '--passWithNoTests',
        '--coverage',
        '--coverage.reporter=lcov',
        `--coverage.reportsDirectory=${lcovDir}`,
        ...changedArgs
      ],
      { cwd, stdio: 'inherit', env: process.env }
    )
    return r.status ?? 1
  },
  runStryker({ cwd, mutate }) {
    // Plugin-discovery Stryker (`@stryker-mutator/*`) globиться відносно CORE-install-каталогу
    // (`core/dist/src/di/plugin-loader.js` → `../../../../../@stryker-mutator/*`). Тож core
    // МАЄ вантажитись із проєктного `node_modules`, де поряд лежить `@stryker-mutator/vitest-runner`.
    // `npx`/`bunx` тягнуть core у власний кеш (`_npx/<hash>`, `bunx-temp`) БЕЗ плагінів → воркери
    // падають `Cannot find TestRunner plugin "vitest"`. Тому резолвимо локальний core-bin через
    // `import.meta.url` і запускаємо його через `node`. Fallback на `npx`, якщо не встановлено.
    // mutate (непорожній) ⇔ --changed-режим: мутуємо лише змінені production-файли цього root.
    const mutateArgs = mutate && mutate.length > 0 ? ['--mutate', mutate.join(',')] : []
    const strykerBin = resolveLocalStrykerBin()
    const r = strykerBin
      ? spawnSync(strykerBin, ['run', ...mutateArgs], { cwd, stdio: 'inherit', env: process.env })
      : spawnSync('npx', ['@stryker-mutator/core', 'run', ...mutateArgs], { cwd, stdio: 'inherit', env: process.env })
    return r.status ?? 1
  }
}

/**
 * Збирає метрики покриття + мутаційного тестування для **одного** JS-root.
 *
 * Full-режим (`scope === null`): vitest на всьому suite + Stryker на всіх файлах
 * config-глоба. Пропускає workspace без тестів (повертає `null`): vitest пройшов з
 * `--passWithNoTests`, але lcov порожній — нема сенсу запускати Stryker.
 *
 * Changed-режим (`scope = { files, base }`): vitest `--changed <base>` (лише
 * зачеплені тести) + Stryker `--mutate` лише по змінених production-файлах. Тут
 * **не** пропускаємо на порожньому lcov — змінений src без тестів має дати
 * NoCoverage-мутанти (gate впаде, як і має). Якщо змінено лише тест-файли (нема
 * production-src) — Stryker не запускаємо (мутувати нічого), повертаємо лише coverage.
 *
 * Bun-native workspace (prod-код імпортує `bun`/`bun:*`): coverage через
 * `bun test --coverage` (vitest не резолвить модуль `bun`), mutation пропускається
 * з попередженням — Stryker vitest-runner такий код не виконає.
 *
 * `.vue`-мутація: Stryker core мутує `<script>`/`<script setup>` SFC без окремого плагіна.
 * Storybook root (`isStorybookRoot`) → `runJsCoverage` отримує `excludeStorybookProject:
 * true` (`--project=!storybook`), щоб не зачепити browser-mode проєкт (докладніше про стан
 * підтримки browser mode у Stryker — коментар над `collectStorybookForRoot` нижче) —
 * інакше цей самий JS-прогін спробував би й browser-mode тести теж, якщо вони живуть
 * у тому ж vitest.config.mjs.
 *
 * Реальні помилки (vitest/bun exit ≠ 0, відсутній mutation.json попри запуск Stryker)
 * кидаються — у multi-root режимі це не маскує справжній збій.
 * @param {string} jsRoot абсолютний шлях до workspace-кореня
 * @param {string} cwd корінь проєкту (для рібейзингу `survived[].file`)
 * @param {{runJsCoverage:Function, runStryker:Function, runBunCoverage:Function}} runner spawn-ін'єкція
 * @param {{files:string[], base:string|null}|null} [scope] changed-scope (null = full-режим)
 * @returns {Promise<{coverage:object, mutation:{caught:number,total:number}, survived:Array<object>} | null>} результати або null коли full-режим і workspace без тестів
 */
async function collectOneRoot(jsRoot, cwd, runner, scope = null) {
  const wsRel = relative(cwd, jsRoot)
  // У changed-режимі production-файли для мутації = змінені JS/Vue цього root без
  // тест-файлів і без *.stories.* (сторі — не production-код, окремий Storybook-вимір).
  // `.vue` тут ЗАЛИШАЄТЬСЯ — Stryker core мутує <script>/<script setup> SFC (з v7+),
  // допоки покриття дають НЕ-browser-mode тести (@vue/test-utils тощо, не Storybook-сторі).
  const mutateSrc = scope ? scope.files.filter(f => !TEST_FILE.test(f) && !STORIES_FILE_RE.test(f)) : null

  // Bun-native workspace: coverage через `bun test`, mutation пропускається
  // (Stryker vitest-runner не виконає код з `import ... from 'bun'`).
  const bunNative = await isBunNativeRoot(jsRoot)
  // Storybook root: named vitest-проєкт "storybook" (browser mode) типово ділить один
  // vitest.config.mjs зі звичайним suite — виключаємо його з JS-прогону (див. runJsCoverage).
  const excludeStorybookProject = !bunNative && (await isStorybookRoot(jsRoot))
  if (bunNative && !(await hasRunnableTests(jsRoot))) {
    // `bun test` без тестів завершується помилкою — graceful skip як vitest --passWithNoTests.
    return scope
      ? {
          coverage: { lines: { covered: 0, total: 0 }, functions: { covered: 0, total: 0 } },
          mutation: { caught: 0, total: 0 },
          survived: []
        }
      : null
  }

  // 1. Coverage: vitest run --passWithNoTests --coverage (+ --changed) або `bun test --coverage`
  const lcovDir = await mkdtemp(join(tmpdir(), 'js-cov-'))
  let coverage
  try {
    const code = bunNative
      ? await runner.runBunCoverage({ cwd: jsRoot, lcovDir })
      : await runner.runJsCoverage(
          scope
            ? { cwd: jsRoot, lcovDir, base: scope.base, excludeStorybookProject }
            : { cwd: jsRoot, lcovDir, excludeStorybookProject }
        )
    if (code !== 0) throw new Error(`JS coverage exit ${code}`)
    const lcovPath = join(lcovDir, 'lcov.info')
    coverage = existsSync(lcovPath)
      ? parseLcov(await readFile(lcovPath, 'utf8'))
      : { lines: { covered: 0, total: 0 }, functions: { covered: 0, total: 0 } }
  } finally {
    await rm(lcovDir, { recursive: true, force: true })
  }

  // Bun-native: mutation testing пропускаємо чесно, з попередженням — Stryker
  // vitest-runner структурно несумісний із bun-native кодом.
  if (bunNative) {
    console.error(
      `⚠ ${wsRel || '.'}: bun-native workspace (import 'bun' у prod-коді) — ` +
        'mutation testing пропущено (Stryker vitest-runner несумісний), лише line coverage'
    )
    return { coverage, mutation: { caught: 0, total: 0 }, survived: [] }
  }

  // Full-режим: порожній lcov ⇔ vitest не знайшов тестів → пропускаємо workspace,
  // щоб не ганяти Stryker марно. У changed-режимі НЕ пропускаємо (див. JSDoc).
  if (!scope) {
    const hasTests = coverage.lines.total > 0 || coverage.functions.total > 0
    if (!hasTests) return null
  }

  // Changed-режим без production-src (змінено лише тест-файли) → мутувати нічого.
  if (scope && mutateSrc.length === 0) {
    return { coverage, mutation: { caught: 0, total: 0 }, survived: [] }
  }

  // 2. Mutation через Stryker (у changed-режимі — лише по mutateSrc)
  await runner.runStryker(scope ? { cwd: jsRoot, mutate: mutateSrc } : { cwd: jsRoot })
  const mutationPath = join(jsRoot, 'reports', 'stryker', 'mutation.json')
  if (!existsSync(mutationPath)) {
    // Stryker vitest-runner не підтримує сучасний (Playwright-based) vitest browser mode
    // (докладніше — коментар над collectStorybookForRoot): якщо стрикер-фейсінг vitest.config.mjs
    // (на який вказує stryker.config.mjs#vitest.configFile) містить named-проєкт "storybook",
    // Stryker намагається виконати і його — і падає без mutation.json. Виправлення на боці
    // target-проєкту: винести Storybook-проєкт в окремий vitest-конфіг, якого Stryker НЕ бачить
    // (не reused той самий configFile).
    const storybookHint = excludeStorybookProject
      ? ' Root має Storybook (.storybook/ + @storybook/addon-vitest) — якщо vitest.config.mjs, ' +
        'на який вказує stryker.config.mjs#vitest.configFile, містить named-проєкт "storybook" ' +
        '(browser mode), Stryker впаде на ньому (browser mode не підтримується vitest-runner) — ' +
        'винеси Storybook-проєкт в окремий vitest-конфіг.'
      : ''
    throw new Error(
      'js coverage: stryker не залишив mutation.json — ' +
        'переконайся що встановлено canonical stryker.config.mjs (vitest-runner, perTest), ' +
        'або налаштуй його вручну.' +
        storybookHint
    )
  }
  const mutationReport = JSON.parse(await readFile(mutationPath, 'utf8'))
  const parsed = parseStrykerReport(mutationReport, jsRoot)

  return {
    coverage,
    mutation: { caught: parsed.caught, total: parsed.total },
    survived: parsed.survived.map(group => ({
      ...group,
      file: wsRel === '' ? group.file : join(wsRel, group.file),
      exampleTest: group.exampleTest
        ? {
            ...group.exampleTest,
            testFile: wsRel === '' ? group.exampleTest.testFile : join(wsRel, group.exampleTest.testFile)
          }
        : null
    }))
  }
}

/**
 * Збирає Storybook-покриття (Vue/React/... компоненти зі сторі) для **одного** JS-root.
 * Активується лише коли `isStorybookRoot` (тека `.storybook/` + `@storybook/addon-vitest`
 * у deps) і `hasStories` — інакше `null` (root не бере участі у рядку `Vue (Storybook)`).
 *
 * Mutation testing для Storybook-сторі НЕ виконується (лише line coverage) — Stryker
 * vitest-runner несумісний із browser-mode прогоном, той самий принцип, що й bun-native
 * (чесний skip, не мовчазний нуль).
 *
 * **Уточнення стану підтримки (перевіряй перед покладанням на це в майбутньому — площина
 * активно змінюється з обох боків):** issue stryker-js#4557 ("[vitest] support browser
 * mode") ЗАКРИТИЙ через PR stryker-js#4628 ще у 2023 (v8.0.0) — але це стосувалось
 * раннього browser mode доби vitest@1.0.0-beta, ДО сучасної provider-based архітектури
 * (`@vitest/browser-playwright` тощо, стабілізованої у Vitest 4, 2025-12). Той старий фікс
 * НЕ покриває сучасний Playwright-based browser mode, яким користується
 * `@storybook/addon-vitest`: чинна документація Stryker vitest-runner прямо каже
 * "Currently, Browser Mode is not supported" — інструментація Stryker передбачає
 * Node.js-виконання, а сучасний browser mode виконує тести у реальному Chromium через
 * Playwright, що структурно несумісно з тим, як Stryker патчить/спостерігає код.
 *
 * Спільнота вже досліджує AI-agent-driven mutation testing як обхід саме для цього
 * випадку (агент замінює мутант, ганяє реальний test-suite, читає pass/fail, відкатує) —
 * див. https://alexop.dev/posts/mutation-testing-ai-agents-vitest-browser-mode/. Автор сам
 * характеризує це як "complementary, not a replacement" і explicitly НЕ для CI/CD (дорого,
 * повільно, не масштабується). `@7n/test` — CI-орієнтований інструмент, тож свідомо НЕ
 * приймає цей підхід для Storybook-виміру: чесний skip кращий за хиткий agent-based
 * замінник у автоматизованому пайплайні.
 *
 * Changed-режим: запускається тільки якщо серед змінених файлів root-а є хоча б
 * один `.vue`/`*.stories.*` (`scope.files` — вже звужений через `scopeToStorybookRoot`
 * на боці виклику); інакше `null` (root пропускається повністю для цього виміру).
 * @param {string} jsRoot абсолютний шлях workspace-кореня
 * @param {string} cwd корінь проєкту (не використовується напряму, для симетрії сигнатури з collectOneRoot)
 * @param {{runStorybookCoverage:Function}} runner spawn-ін'єкція
 * @param {{files:string[], base:string|null}|null} [scope] changed-scope (null = full-режим)
 * @returns {Promise<{coverage:object, mutation:{caught:number,total:number}, survived:Array<object>} | null>} результат або null коли root не Storybook/без сторі/без relevant-змін
 */
async function collectStorybookForRoot(jsRoot, cwd, runner, scope = null) {
  const wsRel = relative(cwd, jsRoot)
  if (!(await isStorybookRoot(jsRoot))) return null
  if (!(await hasStories(jsRoot))) return null

  const lcovDir = await mkdtemp(join(tmpdir(), 'sb-cov-'))
  let coverage
  try {
    const code = await runner.runStorybookCoverage(
      scope ? { cwd: jsRoot, lcovDir, base: scope.base } : { cwd: jsRoot, lcovDir }
    )
    if (code !== 0) {
      throw new Error(
        `Storybook coverage exit ${code} — перевір встановлений Playwright Chromium ` +
          '(`npx playwright install chromium`) і named vitest-проєкт "storybook" (canonical config)'
      )
    }
    const lcovPath = join(lcovDir, 'lcov.info')
    coverage = existsSync(lcovPath)
      ? parseLcov(await readFile(lcovPath, 'utf8'))
      : { lines: { covered: 0, total: 0 }, functions: { covered: 0, total: 0 } }
  } finally {
    await rm(lcovDir, { recursive: true, force: true })
  }

  console.error(
    `⚠ ${wsRel || '.'}: Storybook (Vue) — mutation testing пропущено ` +
      '(Stryker vitest-runner несумісний із browser-mode), лише line coverage'
  )
  return { coverage, mutation: { caught: 0, total: 0 }, survived: [] }
}

/**
 * Будує підсумковий рядок з масиву per-root результатів через сумування coverage/mutation.
 * @param {string} area назва рядка (`JS`, `Vue (Storybook)`)
 * @param {Array<{coverage:object, mutation:{caught:number,total:number}, survived:Array<object>}>} results per-root результати
 * @returns {{area:string, coverage:object, mutation:{caught:number,total:number}, survived:Array<object>}} агрегований рядок
 */
function buildAreaRow(area, results) {
  let coverage = { lines: { covered: 0, total: 0 }, functions: { covered: 0, total: 0 } }
  let mutation = { caught: 0, total: 0 }
  const survived = []
  for (const r of results) {
    coverage = addCoverage(coverage, r.coverage)
    mutation = addMutation(mutation, r.mutation)
    survived.push(...r.survived)
  }
  return { area, coverage, mutation, survived }
}

/**
 * Збирає JS-метрики покриття + мутаційного тестування, і окремо — Storybook-покриття
 * (Vue/React/... компоненти зі сторі, `collectStorybookForRoot`). У monorepo ітерує усі
 * JS-roots з `resolveAllJsRoots()` (включно з glob-патернами `cf/*`), для кожного root-а
 * запускає обидва виміри незалежно й сумує lcov/mutation окремо через `buildAreaRow`.
 * Workspaces без тестів (JS) або без Storybook-конфігурації/сторі пропускаються по
 * кожному виміру окремо (root може дати лише JS-рядок, лише Storybook-рядок, обидва
 * або жодного). Якщо і JS, і Storybook відсутні всюди — повертає `[]`.
 * Шляхи у `survived` рібейзяться відносно `cwd`, щоб `coverage-fix.mjs`
 * знаходив джерела через `join(projectRoot, file)`.
 *
 * Changed-режим (`opts.changedFiles` задано): JS-вимір отримує лише змінені JS-файли
 * root-а (`scopeToRoot`), Storybook-вимір — лише змінені `.vue`/`*.stories.*`
 * (`scopeToStorybookRoot`); кожен вимір пропускається незалежно, якщо relevant-змін
 * нема. Якщо змін нема ніде — повертає `[]` без error-логу (оркестратор трактує
 * порожній changed-scope як pass).
 * @param {string} cwd корінь проєкту
 * @param {{runner?: typeof defaultRunner, changedFiles?: string[], base?: string|null}} [opts] runner-ін'єкція + changed-scope
 * @returns {Promise<Array<{area:string, coverage:object, mutation:{caught:number,total:number}, survived:Array<object>}>>} рядки `JS`/`Vue (Storybook)` — лише ті, де є дані
 */
export async function collect(cwd, opts = {}) {
  const runner = opts.runner ?? defaultRunner
  const changed = Array.isArray(opts.changedFiles)
  const jsRoots = await resolveAllJsRoots(cwd)
  if (jsRoots.length === 0) throw new Error('js coverage: package.json не знайдено')

  const jsResults = []
  const storybookResults = []
  for (const jsRoot of jsRoots) {
    if (changed) {
      const jsFiles = scopeToRoot(opts.changedFiles, cwd, jsRoot)
      if (jsFiles.length > 0) {
        const scope = { files: jsFiles, base: opts.base ?? null }
        const r = await collectOneRoot(jsRoot, cwd, runner, scope)
        if (r !== null) jsResults.push(r)
      }

      const sbFiles = scopeToStorybookRoot(opts.changedFiles, cwd, jsRoot)
      if (sbFiles.length > 0) {
        const sbScope = { files: sbFiles, base: opts.base ?? null }
        const sb = await collectStorybookForRoot(jsRoot, cwd, runner, sbScope)
        if (sb !== null) storybookResults.push(sb)
      }
      continue
    }

    const r = await collectOneRoot(jsRoot, cwd, runner, null)
    if (r !== null) jsResults.push(r)

    const sb = await collectStorybookForRoot(jsRoot, cwd, runner, null)
    if (sb !== null) storybookResults.push(sb)
  }

  const rows = []
  if (jsResults.length > 0) {
    rows.push(buildAreaRow('JS', jsResults))
  } else if (!changed) {
    console.error(
      'js coverage: жоден workspace не має тестів ' +
        '(`*.test.{js,mjs}` у `tests/` або поряд із джерелом) — ' +
        'додай тести або запусти `npx @7n/test` для генерації'
    )
  }
  if (storybookResults.length > 0) {
    rows.push(buildAreaRow('Vue (Storybook)', storybookResults))
  }
  return rows
}
