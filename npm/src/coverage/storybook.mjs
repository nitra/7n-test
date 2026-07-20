/**
 * Детекція Storybook-workspace-ів (Vue/React/... компоненти зі сторі), покриття
 * яких рахує vitest browser mode через `@storybook/addon-vitest` (сучасна заміна
 * legacy `@storybook/test-runner` + `@storybook/addon-coverage`). Root вважається
 * Storybook-workspace лише коли є **обидва** сигнали — тека `.storybook/` (конфіг)
 * і сам `@storybook/addon-vitest` у deps: самої теки замало (legacy Storybook без
 * vitest-інтеграції теж має `.storybook/`), самого addon-у замало (може бути
 * встановлений, але вимкнений/не налаштований).
 */
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { walk } from './fs-walk.mjs'

/** `*.stories.*` файли — не production-код, окремий вимір покриття (Storybook, не JS-рядок). */
export const STORIES_FILE_RE = /\.stories\.[^.]+$/

/**
 * Чи workspace налаштовано під Storybook coverage через vitest: тека `.storybook/`
 * присутня **і** `@storybook/addon-vitest` декларовано в dependencies/devDependencies.
 * @param {string} jsRoot абсолютний шлях workspace-кореня
 * @returns {Promise<boolean>} true для Storybook-workspace з vitest-інтеграцією
 */
export async function isStorybookRoot(jsRoot) {
  if (!existsSync(join(jsRoot, '.storybook'))) return false
  const pkgPath = join(jsRoot, 'package.json')
  if (!existsSync(pkgPath)) return false
  let pkg
  try {
    pkg = JSON.parse(await readFile(pkgPath, 'utf8'))
  } catch {
    return false
  }
  return (
    Boolean(pkg.dependencies?.['@storybook/addon-vitest']) || Boolean(pkg.devDependencies?.['@storybook/addon-vitest'])
  )
}

/**
 * Чи workspace має хоч один `*.stories.*` файл (`node_modules`/`dist`/… не скануються).
 * @param {string} jsRoot абсолютний шлях workspace-кореня
 * @returns {Promise<boolean>} true, якщо знайдено хоча б один сторі-файл
 */
export async function hasStories(jsRoot) {
  let found = false
  await walk(jsRoot, abs => {
    if (STORIES_FILE_RE.test(abs)) found = true
  })
  return found
}
