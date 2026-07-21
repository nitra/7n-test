/**
 * Швидкий PR-прогін Storybook-виміру — команда `@7n/test storybook`.
 *
 * Канон Storybook (ADR «Канон Storybook для Vue-компонентних бібліотек»,
 * Кластер 5) розподіляє прогони: **PR** — лише швидкий `vitest run
 * --project=storybook` (named vitest-проєкт, browser-mode лише chromium) як
 * pass/fail-гейт, без coverage-інструментації і без mutation testing; **nightly**
 * — повний `@7n/test coverage` (line coverage + mutation testing, Stryker через
 * ізольований `vitest.stryker.config.*`). Цей модуль реалізує PR-половину.
 *
 * Прогін іде по всіх workspace-roots з канонічними Storybook-identity devDeps
 * (`isStorybookRoot`); репо без жодного Storybook-пакета — чесний no-op (exit 0),
 * щоб команду можна було безумовно ставити в PR-workflow будь-якого репо.
 */
import { spawnSync } from 'node:child_process'
import { relative } from 'node:path'
import { cwd as getCwd } from 'node:process'

import { isStorybookRoot } from './coverage/storybook.mjs'
import { resolveAllJsRoots } from './lib/resolve-js-root.mjs'

/**
 * Дефолтний spawn-runner (інʼєктується в тестах). `--passWithNoTests`: канонічний
 * пакет може ще не мати жодного сторі-файлу (LLM-генерація stories — хвиля 2
 * канону) — порожній storybook-проєкт не має валити PR-гейт.
 */
export const defaultRunner = {
  /**
   * Запускає storybook-проєкт vitest у workspace-корені.
   * @param {{cwd: string}} opts корінь workspace-а
   * @returns {number} exit code прогону
   */
  runStorybookProject({ cwd }) {
    const r = spawnSync('bunx', ['vitest', 'run', '--project=storybook', '--passWithNoTests'], {
      cwd,
      stdio: 'inherit',
      env: process.env
    })
    return r.status ?? 1
  }
}

/**
 * CLI entrypoint `@7n/test storybook`: швидкий PR-прогін storybook-проєкту по всіх
 * Storybook-roots. Помилка одного root-а не зупиняє решту — агрегований exit code
 * ≠ 0, якщо впав хоча б один.
 * @param {{cwd?: string, runner?: typeof defaultRunner}} [opts] опції запуску
 * @returns {Promise<number>} exit code (0 — усі Storybook-roots зелені або їх немає)
 */
export async function runStorybookCli(opts = {}) {
  const cwd = opts.cwd ?? getCwd()
  const runner = opts.runner ?? defaultRunner

  const storybookRoots = []
  for (const jsRoot of await resolveAllJsRoots(cwd)) {
    if (await isStorybookRoot(jsRoot)) storybookRoots.push(jsRoot)
  }

  if (storybookRoots.length === 0) {
    console.log('✓ storybook: Storybook-пакетів не знайдено (канонічні identity-devDeps відсутні) — пропускаю')
    return 0
  }

  let failures = 0
  for (const jsRoot of storybookRoots) {
    const wsRel = relative(cwd, jsRoot) || '.'
    console.log(`\n→ ${wsRel}: vitest run --project=storybook (browser-mode chromium, PR-гейт канону Storybook)\n`)
    const code = await runner.runStorybookProject({ cwd: jsRoot })
    if (code !== 0) {
      failures += 1
      console.error(
        `✗ ${wsRel}: storybook-проєкт упав (exit ${code}) — перевір встановлений Playwright Chromium ` +
          '(`npx playwright install chromium`) і канонічний vitest.config з named-проєктом "storybook" ' +
          '(`npx @7n/rules lint storybook` відтворить канон)'
      )
    }
  }

  if (failures === 0) {
    console.log(`\n✓ storybook: ${storybookRoots.length} Storybook-root(и) зелені`)
    return 0
  }
  return 1
}
