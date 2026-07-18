# `stryker.storybook.config.mjs` — canonical config для full-режиму Storybook-мутації

> [!WARNING]
> **Full-режим (цей документ) — НЕ перевірено як робочий на реальному Storybook 10 +
> Vue 3 проєкті (2026-07-18, докладніше — секція «Обмеження» внизу).** Знайдено
> ДВІ незалежні причини провалу: (1) Stryker-інструментація ламає `vue-docgen-api`
> парсер `@storybook/vue3-vite` — **виправна**, `docgen: false` у
> `.storybook/main.js#framework.options`; (2) окремий, підтверджений upstream-баг
> Vitest browser mode (`Failed to fetch dynamically imported module` на
> холодному старті dev-сервера, [vitest#9509](https://github.com/vitest-dev/vitest/issues/9509))
> — **НЕ виправна** на нашому боці, детерміновано відтворена 3/3 спроб навіть
> після фіксу (1). Для реальної mutation-мутації Storybook-коду використовуй
> **`--changed`-режим** (власний mutate→run→restore executor,
> `storybook-mutation.mjs`) — той шлях **перевірено й підтверджено робочим** на
> реальному Storybook 10 + Vue 3 скаффолді, включно з LLM-мутантами. Full-режим
> лишається задокументованим як напрямок для майбутньої роботи (чекає на фікс
> у Vitest), не як готовий до використання зараз.

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

## Обов'язково: `docgen: false` у `.storybook/main.js`

```js
// .storybook/main.js
export default {
  // ...
  framework: {
    name: '@storybook/vue3-vite',
    options: {
      docgen: false
    }
  }
}
```

Без цього — Stryker-інструментація `<script>`-блоку (`stryMutAct_*`/`stryCov_*`
wrapper-функції, які інжектить Instrumenter ще до dry-run, незалежно від того,
чи активний якийсь мутант) ламає `vue-docgen-api`-парсер, яким `@storybook/vue3-vite`
парсить SFC для autodocs/Controls (незалежно від того, чи `@storybook/addon-docs`
явно у списку `addons` — vue-docgen вбудований у сам framework preset). Симптом:
`[vite] Internal server error: No suitable component definition found on
Button.vue — Plugin: storybook:vue-docgen-plugin`, який каскадно ламає
транспіляцію відповідного `*.stories.js` і зрештою проявляється як
`Failed to fetch dynamically imported module` у браузері. `docgen: false`
вимикає argTypes/Controls-інференс — прийнятний trade-off для mutation-прогону
(не для звичайної розробки в Storybook UI).

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

1. Прогони `npx stryker run stryker.storybook.config.mjs` (`configFile` —
   позиційний аргумент, НЕ `--configFile`; `stryker run [options] [configFile]`) на
   свідомо малому `mutate`-scope (1-2 файли).
2. Переконайся, що є хоча б один **survived** мутант — 100% killed на
   нетривіальному файлі є підозрілим сигналом (найімовірніше, `define` не
   долетів до sandbox-копії конфіга, і мутанти взагалі не активуються, а
   тести просто завжди проходять "у пустоту").
3. Якщо Storybook-конфіг мерджить `vite.config`/`.storybook/main.js` з інших
   джерел — перевір, що `define` не губиться при мерджі (той самий 100%-сигнал).

## Обмеження (на 2026-07-18)

### Full-режим (command runner) — відомо непрацездатний на реальному проєкті

Перевірено на реальному `storybook init`-скаффолді (Storybook 10.5.2, Vue 3.5,
Vitest 4.1.10, `@vitest/browser-playwright`, Stryker `9.6.1`) — на відміну від
синтетичного spike-репо з попередньої ітерації (плейн JS, без Storybook-плагінів).
`npx stryker run stryker.storybook.config.mjs --dryRunOnly` падає ще на dry-run
(ДО будь-якої мутації) з `Failed to fetch dynamically imported module`. Розслідування
виявило **дві незалежні причини**.

**Причина 1 — vue-docgen-api несумісний зі Stryker-інструментацією (виправлено вище,
`docgen: false`).** Root cause підтверджено: витягнуто РЕАЛЬНИЙ інструментований
вміст `Button.vue` з `.stryker-tmp/sandbox-*` (Stryker огортає кожен вираз
`stryMutAct_*`/`stryCov_*`-wrapper-функціями ще на dry-run, незалежно від
активного мутанта), підставлено його напряму в проєкт (без жодної участі
Stryker-процесу) і прогнано звичайний `vitest run --project=storybook` — та сама
помилка відтворилась 1:1 (`storybook:vue-docgen-plugin` → `No suitable component
definition found` → каскадно ламає транспіляцію `*.stories.js` → `Failed to fetch`
у браузері). Спроба видалити `@storybook/addon-docs` з `addons` цю гіпотезу
спершу здавалась спростованою (помилка лишалась) — але то було тому, що
vue-docgen вбудований у сам framework preset `@storybook/vue3-vite`, а не
залежить від addon-а. `docgen: false` (секція вище) усуває цю причину повністю
— підтверджено (vue-docgen-повідомлення зникають з логів).

**Причина 2 — окремий, підтверджений upstream-баг Vitest browser mode
(НЕ виправна на нашому боці).** Після фіксу причини 1 fetch-помилка НЕ зникла,
а перемістилась на **інший файл** — `node_modules/@storybook/addon-vitest/dist/vitest-plugin/setup-file.js`
(не мутований Stryker-ом узагалі — поза `mutate`-glob). Три послідовні
`--dryRunOnly`-спроби (з чистим `.stryker-tmp` між ними) дали **ідентичну
помилку 3/3 рази** — не флейкі. Прогрів `node_modules/.vite`-кешу окремим
успішним `vitest run` перед Stryker-прогоном (щоб виключити race холодного
dep-optimizer) теж не допоміг. Це відповідає відомому й досі відкритому issue
[vitest-dev/vitest#9509](https://github.com/vitest-dev/vitest/issues/9509)
("Flaky 'Failed to fetch dynamically imported module'... in CI") — фіксується
не в `@7n/test`, а вище за течією у Vitest.

Той самий `npx vitest run --project=storybook` (та сама команда, той самий
проєкт) працює **бездоганно**, коли його запускає наш власний `--changed`-
executor (`spawnSync` напряму, без участі Stryker) — 8/8 тестів проходять,
реальні мутанти реально вбиваються/виживають. Причина 2 відтворюється лише в
контексті "свіжий/sandboxed spawn" Stryker-а (і, за issue #9509, у CI-подібних
середовищах загалом), не в звичайному прямому виклику.

**Висновок:** до фіксу вище за течією у Vitest — не покладайся на full-режим для
реальних Storybook-проєктів, навіть з `docgen: false`. `--changed`-режим
(`storybook-mutation.mjs`) лишається єдиним підтвердженим шляхом отримати
реальний mutation score для Storybook-коду.

### Інші (не пов'язані з основною проблемою, лишаються чинними для command runner загалом)

- `node_modules` у sandbox-копії — symlinked (дефолт Stryker); Playwright
  browser cache (`~/Library/Caches/ms-playwright` тощо) резолвиться коректно.
- Відносні шляхи у Storybook/vite-конфізі переживають копіювання в sandbox;
  абсолютні шляхи (`__dirname`-anchored aliases) — ні.
