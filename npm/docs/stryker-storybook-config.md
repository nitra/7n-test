# `stryker.storybook.config.mjs` — canonical config для full-режиму Storybook-мутації

> [!WARNING]
> **Full-режим (цей документ) — НЕ перевірено як робочий на реальному Storybook 10 +
> Vue 3 проєкті (2026-07-18, докладніше — секція «Обмеження» внизу).** Command
> runner падає з `Failed to fetch dynamically imported module` для `*.stories.js`
> ще на dry-run, root cause не встановлено (не symlink/sandbox, не concurrency, не
> `@storybook/addon-docs`/vue-docgen — усе перевірено й відкинуто). Для реальної
> mutation-мутації Storybook-коду використовуй **`--changed`-режим** (власний
> mutate→run→restore executor, `storybook-mutation.mjs`) — той шлях **перевірено
> й підтверджено робочим** на реальному Storybook 10 + Vue 3 скаффолді, включно з
> LLM-мутантами. Full-режим лишається задокументованим як напрямок для майбутньої
> роботи, не як готовий до використання зараз.

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
Результат: `npx stryker run stryker.storybook.config.mjs --dryRunOnly` падає
на самому dry-run (ДО будь-якої мутації) з:

```
Error: Failed to import test file .../src/stories/Button.stories.js
Caused by: TypeError: Failed to fetch dynamically imported module: http://localhost:PORT/.../Button.stories.js?import&browserv=...
```

Перевірені й **відкинуті** гіпотези root cause (кожна емпірично протестована):

- **Symlink sandbox** — Stryker за замовчуванням symlink-ає `node_modules` у
  `.stryker-tmp/sandbox-*`; Vite theoretically могла б блокувати fs-доступ до
  symlink-цілі поза sandbox-root (`server.fs.allow`). Спростовано: `inPlace: true`
  (без sandbox, без symlink, прогін напряму в оригінальній директорії) дає
  **ту саму помилку**.
- **`@storybook/addon-docs`/`vue-docgen-plugin`** — dry-run логи показували
  `No suitable component definition found on Button.vue` від
  `storybook:vue-docgen-plugin` ПЕРЕД fetch-помилкою, що виглядало як
  Stryker-інструментація ламає vue-docgen-api парсер. Спростовано: видалення
  `@storybook/addon-docs` з `.storybook/main.js#addons` не усуває fetch-помилку
  (хоча й прибирає vue-docgen-повідомлення — отже це окремий, не пов'язаний
  побічний симптом).
- **Concurrency/port-конфлікт** — `concurrency: 2` могла давати два Chromium-
  воркери на той самий порт. Спростовано: `concurrency: 1` — та сама помилка.

Той самий `npx vitest run --project=storybook` (та сама команда, той самий
проєкт) працює **бездоганно**, коли його запускає наш власний `--changed`-
executor (`spawnSync` напряму, без участі Stryker) — 8/8 тестів проходять,
реальні мутанти реально вбиваються/виживають. Тобто проблема специфічна саме
для того, як Stryker command runner спавнить/оточує цей процес — не в самому
проєкті чи в команді. Root cause **не встановлено**; кандидати для подальшого
розслідування: різниця env-змінних, які Stryker додає при spawn (`CI`,
`NODE_ENV` тощо), різниця в тому, як Stryker перехоплює stdio/exit-коди
дочірнього процесу, або щось специфічне до async dry-run координації Stryker
з довгоживучим Vite dev-server процесом (на відміну від нашого executor-а,
де кожен виклик — самостійний короткий `spawnSync`).

**Висновок:** до подальшого розслідування — не покладайся на full-режим для
реальних Storybook-проєктів. `--changed`-режим (`storybook-mutation.mjs`)
лишається єдиним підтвердженим шляхом отримати реальний mutation score для
Storybook-коду.

### Інші (не пов'язані з основною проблемою, лишаються чинними для command runner загалом)

- `node_modules` у sandbox-копії — symlinked (дефолт Stryker); Playwright
  browser cache (`~/Library/Caches/ms-playwright` тощо) резолвиться коректно.
- Відносні шляхи у Storybook/vite-конфізі переживають копіювання в sandbox;
  абсолютні шляхи (`__dirname`-anchored aliases) — ні.
