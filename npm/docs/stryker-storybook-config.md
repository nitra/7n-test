# `stryker.storybook.config.mjs` — canonical config для full-режиму Storybook-мутації

> [!WARNING]
> **Full-режим (цей документ) — перевірено як робочий на реальному Storybook 10 +
> Vue 3 проєкті наскрізь, через сам `@7n/test coverage` (не лише сирий
> `stryker run`) (2026-07-18, докладніше — секція «Обмеження» внизу), АЛЕ лише за
> ТРЬОХ обов'язкових умов.** Знайдено дві незалежні причини провалу dry-run і
> одну причину провалу вже ПІСЛЯ dry-run (на реальних мутантах):
> (1) Stryker-інструментація ламає `vue-docgen-api` парсер `@storybook/vue3-vite`
> — виправна через `docgen: false` у `.storybook/main.js#framework.options`;
> (2) `node_modules` у sandbox-копії Stryker (`.stryker-tmp/sandbox-*`) —
> symlink на оригінальний `node_modules`, і `@storybook/addon-vitest` резолвить
> абсолютний шлях свого `setup-file.js` через реальний (symlink-target) шлях,
> а не через шлях sandbox-кореня — Vite dev server відмовляється віддавати файл
> поза власним root, браузер бачить це як `Failed to fetch dynamically imported
> module`. Виправна через **`inPlace: true`** у цьому конфізі (Stryker мутує
> файли на місці, без sandbox-копії — symlink-проблема просто не виникає);
> (3) Stryker інструментує самі `*.stories.js` файли, якщо `mutate`-glob їх не
> виключає — ламає CSF-індексацію Storybook (`export default` перестає бути
> літеральним об'єктом). Виправна виключенням `!src/**/*.stories.*` і
> `!src/**/*.mdx` з `mutate`. Усі ТРИ причини — **виправні конфігом**, усі три
> фікси нижче обов'язкові. Наскрізний прогін з усіма трьома фіксами дав
> реальний mutation score (15/59 вбито) на реальних `Button.vue`/`Header.vue`/
> `Page.vue`. `--changed`-режим (власний mutate→run→restore executor,
> `storybook-mutation.mjs`) лишається окремим, незалежно перевіреним шляхом
> (детерміновані AST-мутанти + LLM-мутанти) — обирай його для звичайного
> PR-прогону по змінених файлах, full-режим — для рідшого (nightly/weekly)
> прогону по всій кодовій базі.

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
  mutate: ['src/**/*.{js,ts,vue}', '!src/**/*.stories.*', '!src/**/*.mdx'],
  reporters: ['json'],
  jsonReporter: {
    fileName: 'reports/stryker-storybook/mutation.json'
  },
  inPlace: true
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
- **`inPlace: true` — ОБОВ'ЯЗКОВЕ**, див. секцію нижче — без нього dry-run
  падає детерміновано (100% відтворень) через symlinked `node_modules` у
  Stryker sandbox-копії.
- **`!src/**/*.stories.*` і `!src/**/*.mdx` у `mutate` — ОБОВ'ЯЗКОВІ виключення.**
  Без них Stryker інструментує самі `*.stories.js` файли (обгортає
  `export default { ... }` у `stryMutAct_*`/`stryCov_*`-wrapper-функції ще на
  dry-run) — Storybook-індексатор історій вимагає, щоб `default export` був
  ЛІТЕРАЛЬНИМ об'єктом, і падає з `CSF: default export must be an object`,
  що каскадно ламає весь dry-run (`AggregateError: Failed to initialize
  projects`). Перевірено на реальному проєкті: без цих виключень `@7n/test
  coverage` падає ще до першого мутанта; з ними — 15/59 мутантів коректно
  вбито на реальних `Button.vue`/`Header.vue`/`Page.vue`.

## Обов'язково: `inPlace: true` (обхід symlinked `node_modules` у sandbox)

Stryker за замовчуванням копіює проєкт у тимчасову sandbox-теку
(`.stryker-tmp/sandbox-<random>/`) перед кожним прогоном і **symlink**-ає туди
`node_modules` (замість повного копіювання — так швидше). `@storybook/addon-vitest`
резолвить абсолютний шлях свого `setup-file.js` через РЕАЛЬНИЙ (symlink-target)
шлях, а не через шлях sandbox-кореня, і Vite dev server (browser mode) відмовляється
віддавати файл, що лежить поза власним root — браузер бачить це як generic
`TypeError: Failed to fetch dynamically imported module`. `inPlace: true` каже
Stryker мутувати файли БЕЗ sandbox-копії (на місці, з backup/restore) — symlink
просто не задіяний, і проблема зникає повністю.

Тримай `concurrency: 1` явно в конфізі (як у прикладі вище) — з `inPlace: true`
воркери мутують РЕАЛЬНІ файли проєкту (не ізольовані sandbox-копії), тож
паралельні воркери конкурували б за одні й ті самі файли.

**Альтернатива, яку НЕ варто використовувати:** `symlinkNodeModules: false`
виглядає як більш прицільний фікс (вимкнути тільки symlink, лишити sandbox-ізоляцію),
але не працює — `node_modules` завжди у `ignorePatterns` Stryker-а (не
копіюється у sandbox взагалі), тож без symlink sandbox лишається БЕЗ
`node_modules` повністю, якщо не додати дорогий `buildCommand` з повним
`npm install` на кожен прогін.

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
або втрачений `define` дає хибний ~100% score. Перед тим як покладатись на
результат:

1. Прогони `npx stryker run stryker.storybook.config.mjs` (`configFile` —
   позиційний аргумент, НЕ `--configFile`; `stryker run [options] [configFile]`) на
   свідомо малому `mutate`-scope (1-2 файли).
2. Переконайся, що є хоча б один **survived** мутант — 100% killed на
   нетривіальному файлі є підозрілим сигналом (найімовірніше, `define` не
   активує мутанти, і тести просто завжди проходять "у пустоту").
3. Якщо Storybook-конфіг мерджить `vite.config`/`.storybook/main.js` з інших
   джерел — перевір, що `define` не губиться при мерджі (той самий 100%-сигнал).

## Обмеження (на 2026-07-18)

### Full-режим (command runner) — тепер працює на реальному проєкті, за умови обох фіксів

Перевірено на реальному `storybook init`-скаффолді (Storybook 10.5.2, Vue 3.5,
Vitest 4.1.10, `@vitest/browser-playwright`, Stryker `9.6.1`) — на відміну від
синтетичного spike-репо з попередньої ітерації (плейн JS, без Storybook-плагінів).
Без обох фіксів нижче `npx stryker run stryker.storybook.config.mjs --dryRunOnly`
падає ще на dry-run (ДО будь-якої мутації) з `Failed to fetch dynamically
imported module`. Розслідування виявило **дві незалежні причини**, обидві тепер
виправлені конфігом.

**Причина 1 — vue-docgen-api несумісний зі Stryker-інструментацією (виправлено,
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

**Причина 2 — symlinked `node_modules` у Stryker sandbox-копії (виправлено,
`inPlace: true`).** Після фіксу причини 1 fetch-помилка НЕ зникла, а
перемістилась на **інший файл** — `node_modules/@storybook/addon-vitest/dist/vitest-plugin/setup-file.js`
(не мутований Stryker-ом узагалі — поза `mutate`-glob). 11 послідовних
`--dryRunOnly`-спроб дали ідентичну помилку 11/11 разів — детерміновано, не
флейкі.

Спершу це виглядало як [vitest-dev/vitest#9509](https://github.com/vitest-dev/vitest/issues/9509)
("Flaky 'Failed to fetch dynamically imported module'... in CI") — але той
issue закритий як виправлений через широкий `optimizeDeps.include`, і той
самий підхід для нашого Vue-стеку (`vue`, `@vue/reactivity`, `@vue/runtime-core`,
`@storybook/vue3`, `@storybook/global`, обидва `setup-file`-специфікатори) —
**не допоміг**. Сигнал, що #9509 і наш кейс — різні баги з однаковим
симптомом: у #9509 падав файл КОМПОНЕНТА (пізня стадія графа модулів), у нас
— завжди СЕТАП-ФАЙЛ (найперша стадія).

Ізоляційний експеримент з `mutate`-glob без жодного файлу (`Instrumented 0
source file(s)`) дав ту саму помилку — виключив вміст файлів/інструментацію
як причину. Виявилось, що причина зовсім не про вміст файлів чи Stryker-
оркестрацію процесу як таку — а конкретно про те, що Stryker sandbox
symlink-ає `node_modules` в тимчасову sandbox-теку (`.stryker-tmp/sandbox-*`),
а `@storybook/addon-vitest` резолвить абсолютний шлях свого `setup-file.js`
через РЕАЛЬНИЙ (symlink-target) шлях, а не через sandbox-корінь. Vite dev
server відмовляється віддавати файл поза власним root — браузер бачить це
як generic `Failed to fetch dynamically imported module`. Підтверджено
прямим експериментом: `vitest run` (без жодного Stryker) із `node_modules`,
вручну зроблений symlink-ом з іншої директорії, відтворює ту саму помилку 1:1;
той самий `node_modules`, скопійований (не symlink) у нову директорію — працює
без помилок. `resolve.preserveSymlinks: true` (Vite) і `NODE_OPTIONS=--preserve-symlinks`
(Node) — **не** допомагають, бо шлях резолвиться всередині коду самого
`@storybook/addon-vitest`, а не через Vite-резолвер. `inPlace: true` (секція
вище) обходить проблему повністю, мутуючи файли без sandbox-копії — symlink
просто не задіяний.

**Причина 3 — Stryker інструментує самі `*.stories.js` файли, якщо `mutate`
їх не виключає (виправлено, `!src/**/*.stories.*` / `!src/**/*.mdx`).**
Виявлено вже ПІСЛЯ фіксу причин 1 і 2, при наскрізному прогоні через сам
`@7n/test coverage` (не сирий `stryker run`) з реалістичним `mutate`-glob
(`src/**/*.{js,ts,vue}`, без виключень) — dry-run падав з
`AggregateError: Failed to initialize projects` → `CSF: default export must
be an object` для КОЖНОГО `*.stories.js`. Stryker огортає `export default {
...}` у `stryMutAct_*`-wrapper ще на dry-run (той самий механізм, що й
причина 1), а Storybook-індексатор історій вимагає літеральний об'єкт у
`default export` — обгорнутий вираз більше не проходить статичний аналіз.
Виправлено додаванням `!src/**/*.stories.*` і `!src/**/*.mdx` до `mutate`
(секція «Обов'язкові поля» вище) — мутувати самі `*.stories.js` файли й так
немає сенсу, вони не production-логіка.

**Висновок:** з усіма трьома фіксами (`docgen: false` + `inPlace: true` +
виключення `*.stories.*`/`*.mdx` з `mutate`) full-режим ПОВНІСТЮ працює на
реальному Storybook-проєкті — перевірено наскрізно через сам `@7n/test
coverage` (не лише сирий `stryker run`): реальний mutation score 15/59
вбито на `Button.vue`/`Header.vue`/`Page.vue`/`main.js`, `COVERAGE.md`
згенеровано коректно. `--changed`-режим (`storybook-mutation.mjs`)
лишається окремим, незалежно перевіреним шляхом для звичайного PR-прогону
по змінених файлах.

### Інші (не пов'язані з основною проблемою, лишаються чинними для command runner загалом)

- Відносні шляхи у Storybook/vite-конфізі переживають копіювання в sandbox;
  абсолютні шляхи (`__dirname`-anchored aliases) — ні. З `inPlace: true` це
  не актуально (нема sandbox-копіювання).
- Playwright browser cache (`~/Library/Caches/ms-playwright` тощо) резолвиться
  коректно як у sandbox-, так і в inPlace-режимі.
