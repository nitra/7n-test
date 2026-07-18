# `stryker.storybook.config.mjs` — canonical config для full-режиму Storybook-мутації

Ручна (не auto-generated) довідка для мейнтейнерів target-проєктів. Без цього
файлу `@7n/test coverage` (full-режим, без `--changed`) для рядка
`Vue (Storybook)` дає лише line coverage — mutation testing свідомо
пропускається з попередженням (див. коментар над `collectStorybookForRoot` у
`npm/src/coverage/js-collector.mjs`).

## Навіщо окремий конфіг

Stryker vitest-runner не підтримує сучасний (Playwright-based) vitest browser
mode, яким користується `@storybook/addon-vitest` — тому мутація Storybook-коду
в full-режимі йде через Stryker **command runner** (не vitest-runner), окремим
прогоном від звичайного JS-виміру. Ось чому саме окремий config-файл, а не
секція у наявному `stryker.config.mjs`: `testRunner` — один на конфіг, і JS-вимір
уже займає `vitest-runner`.

## Обов'язкові поля

```js
// stryker.storybook.config.mjs
export default {
  testRunner: 'command',
  commandRunner: {
    command: 'bunx vitest run --project=storybook'
  },
  mutate: ['src/**/*.{js,ts,vue}'],
  reporters: ['json'],
  jsonReporter: {
    fileName: 'reports/stryker-storybook/mutation.json'
  }
}
```

- **`jsonReporter.fileName` МАЄ бути саме `reports/stryker-storybook/mutation.json`**
  (не дефолтний `reports/stryker/mutation.json`) — інакше колізія зі звітом
  звичайного JS-Stryker-прогону, який пише туди ж.
- **`commandRunner.command`** — команда, що запускає Storybook vitest-проєкт
  (browser mode). Якщо назва named-проєкту інша за `storybook` — підправ прапор.
- **`coverageAnalysis` недоступний** для command runner: КОЖЕН мутант ганяє
  ПОВНИЙ suite (не лише зачеплені тести) — full-режим тому й дорогий, розрахований
  на рідший (nightly/weekly) прогін, не на кожен PR.

## Обов'язковий `define` у vite-конфізі browser-проєкту

Без цього кроку — **тихий провал**: усі мутанти "виживають" (0% killed), і
жодної помилки не буде, лише хибно оптимістичний mutation score.

```js
// vitest.config.mjs (або vite-конфіг browser-проєкту "storybook")
export default {
  // ...
  define: {
    'process.env.__STRYKER_ACTIVE_MUTANT__': JSON.stringify(process.env.__STRYKER_ACTIVE_MUTANT__ ?? '')
  }
}
```

**Чому це працює:** Stryker передає активний мутант через env-змінну
`__STRYKER_ACTIVE_MUTANT__`, яку інструментований код читає через
`process.env`. Vitest browser mode ставить кожен ключ `define` як **runtime-
глобал у Chromium** (`createDefinesScript`) — не AST-substitution, а реальне
присвоєння `globalThis.process.env.__STRYKER_ACTIVE_MUTANT__ = "<id>"` перед
запуском тестів. Саме цей шлях і читає інструментація Stryker.

Vite dev server рестартує на кожен мутант (нове значення env), тож `define`
завжди відображає поточний активний мутант — жодного кешування між прогонами.

## Перевірка перед довірою до score

Command runner рахує будь-який ненульовий exit code як "killed" — зламаний
конфіг у sandbox-копії (Stryker копіює проєкт у `.stryker-tmp/sandbox-*`) дає
хибний ~100% score. Перед тим як покладатись на результат:

1. Прогони `npx stryker run --configFile stryker.storybook.config.mjs` на
   свідомо малому `mutate`-scope (1-2 файли).
2. Переконайся, що є хоча б один **survived** мутант — 100% killed на
   нетривіальному файлі є підозрілим сигналом (найімовірніше, `define` не
   долетів до sandbox-копії конфіга, і мутанти взагалі не активуються, а
   тести просто завжди проходять "у пустоту").
3. Якщо Storybook-конфіг мерджить `vite.config`/`.storybook/main.js` з інших
   джерел — перевір, що `define` не губиться при мерджі (той самий 100%-сигнал).

## Обмеження (на 2026-07)

- Не перевірено на реальному Vue+Storybook+Stryker+Playwright проєкті — лише
  на синтетичному spike-репо (Vitest 4, `@vitest/browser-playwright`,
  Stryker `9.6.1`). Перед прийняттям у CI — прогони на власному проєкті.
- `node_modules` у sandbox-копії — symlinked (дефолт Stryker), тому Playwright
  browser cache (`~/Library/Caches/ms-playwright` тощо) і залежності
  резолвяться коректно без додаткових налаштувань.
- Відносні шляхи у Storybook/vite-конфізі переживають копіювання в sandbox;
  **абсолютні шляхи (`__dirname`-anchored aliases) — ні** — якщо конфіг такі
  має, розглянь `inPlace: true` у `stryker.storybook.config.mjs` (мутує реальні
  файли з бекапом/відновленням замість sandbox-копії).
