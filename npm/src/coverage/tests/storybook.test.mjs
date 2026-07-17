/**
 * Тести детекції Storybook-workspace-ів (storybook.mjs): isStorybookRoot вимагає
 * ОБИДВА сигнали (`.storybook/` + `@storybook/addon-vitest` у deps), hasStories
 * шукає `*.stories.*` файли поза node_modules/dist/....
 */
import { describe, expect, test } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { hasStories, isStorybookRoot } from '../storybook.mjs'

/**
 * Тимчасова fixture-директорія workspace-а.
 * @param {Record<string, unknown>} pkg вміст package.json
 * @param {Record<string, string>} [files] відносний шлях → вміст
 * @param {{storybookDir?: boolean}} [opts] чи створювати теку `.storybook/`
 * @returns {string} абсолютний шлях до тимчасового кореня
 */
function makeFixture(pkg, files = {}, { storybookDir = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'storybook-detect-'))
  writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg))
  if (storybookDir) {
    mkdirSync(join(dir, '.storybook'), { recursive: true })
    writeFileSync(join(dir, '.storybook', 'main.js'), 'export default {}\n')
  }
  for (const [rel, content] of Object.entries(files)) {
    const abs = join(dir, rel)
    mkdirSync(join(abs, '..'), { recursive: true })
    writeFileSync(abs, content)
  }
  return dir
}

describe('isStorybookRoot', () => {
  test('true: .storybook/ + @storybook/addon-vitest у devDependencies', async () => {
    const dir = makeFixture({ devDependencies: { '@storybook/addon-vitest': '^9.0.0' } }, {}, { storybookDir: true })
    expect(await isStorybookRoot(dir)).toBe(true)
    rmSync(dir, { recursive: true, force: true })
  })

  test('true: @storybook/addon-vitest у (звичайних) dependencies', async () => {
    const dir = makeFixture({ dependencies: { '@storybook/addon-vitest': '*' } }, {}, { storybookDir: true })
    expect(await isStorybookRoot(dir)).toBe(true)
    rmSync(dir, { recursive: true, force: true })
  })

  test('false: є .storybook/, але немає addon-vitest (legacy Storybook)', async () => {
    const dir = makeFixture({ devDependencies: { storybook: '^8.0.0' } }, {}, { storybookDir: true })
    expect(await isStorybookRoot(dir)).toBe(false)
    rmSync(dir, { recursive: true, force: true })
  })

  test('false: є addon-vitest у deps, але немає теки .storybook/', async () => {
    const dir = makeFixture({ devDependencies: { '@storybook/addon-vitest': '^9.0.0' } })
    expect(await isStorybookRoot(dir)).toBe(false)
    rmSync(dir, { recursive: true, force: true })
  })

  test('false: немає ні .storybook/, ні addon-vitest', async () => {
    const dir = makeFixture({ devDependencies: { vitest: '^2.0.0' } })
    expect(await isStorybookRoot(dir)).toBe(false)
    rmSync(dir, { recursive: true, force: true })
  })

  test('false: немає package.json попри .storybook/', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'storybook-detect-no-pkg-'))
    mkdirSync(join(dir, '.storybook'), { recursive: true })
    expect(await isStorybookRoot(dir)).toBe(false)
    rmSync(dir, { recursive: true, force: true })
  })

  test('false: package.json — невалідний JSON', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'storybook-detect-bad-json-'))
    mkdirSync(join(dir, '.storybook'), { recursive: true })
    writeFileSync(join(dir, 'package.json'), '{ not valid json')
    expect(await isStorybookRoot(dir)).toBe(false)
    rmSync(dir, { recursive: true, force: true })
  })
})

describe('hasStories', () => {
  test('true: знаходить Button.stories.js', async () => {
    const dir = makeFixture(
      { devDependencies: { '@storybook/addon-vitest': '^9.0.0' } },
      { 'src/components/Button.stories.js': 'export default {}\n' },
      { storybookDir: true }
    )
    expect(await hasStories(dir)).toBe(true)
    rmSync(dir, { recursive: true, force: true })
  })

  test('true: знаходить .stories.ts поряд з .vue компонентом', async () => {
    const dir = makeFixture(
      {},
      {
        'src/Card.vue': '<template><div /></template>\n',
        'src/Card.stories.ts': 'export default {}\n'
      }
    )
    expect(await hasStories(dir)).toBe(true)
    rmSync(dir, { recursive: true, force: true })
  })

  test('false: немає жодного *.stories.* файлу', async () => {
    const dir = makeFixture({}, { 'src/Card.vue': '<template><div /></template>\n' })
    expect(await hasStories(dir)).toBe(false)
    rmSync(dir, { recursive: true, force: true })
  })

  test('node_modules не скануються', async () => {
    const dir = makeFixture({}, { 'node_modules/pkg/Button.stories.js': 'export default {}\n' })
    expect(await hasStories(dir)).toBe(false)
    rmSync(dir, { recursive: true, force: true })
  })
})
