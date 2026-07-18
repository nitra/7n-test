# Changelog

## [0.15.0] - 2026-07-18

### Added

- coverage: окремий рядок «Vue (Storybook)» — Storybook-покриття через vitest browser mode (@storybook/addon-vitest), незалежно від JS/mutation-виміру
- Mutation testing тепер мутує `.vue` SFC (`<script>`/`<script setup>`) поряд зі звичайним JS/TS — Stryker core підтримує це нативно, обмеження лише на browser-mode тести (Storybook). `run` (без `--no-mutation`) генерує Storybook CSF3 `.stories.*` для непокритих Vue-компонентів у Storybook-проєктах замість звичайних unit-тестів (`gen-stories.mjs`), з валідацією через реальний `vitest run --project=storybook`.
- coverage: mutation testing для Storybook-покритого коду (vitest browser mode) — власний mutate→run→restore executor у --changed-режимі: детерміновані AST-мутанти (rollup parseAst, 5 тірів операторів) по змінених production-файлах і покритих сторі рядках (lcov DA), вбиває/милує реальний browser-mode прогін зі сторі-фільтром і бюджетами (8/файл, 32/прогін); survived мутанти йдуть у наявний ланцюг classify/fix
- coverage: LLM-джерело мутантів для Storybook mutation executor-а (Mutahunter/Meta-ACH-патерн) — LLM пропонує context-aware bug-like мутанти (off-by-one, підмінені fallback, переплутані аргументи) поверх детермінованих, вбиває/милує так само лише реальний browser-mode прогін; жорстка валідація пропозицій (точний підрядок, покритий рядок, parseAst-синтакс-перевірка), власна стеля 3/файл, graceful degradation без API-ключа, opt-out N_7N_TEST_NO_LLM_MUTANTS=1

### Fixed

- deps: оновити @7n/llm-lib ^2.0.2 → ^2.7.6 — виправляє помилкову класифікацію unresolved-model викликів (порожній modelSpec) як cloud у chain-телеметрії; тепер фактично резолвлена pi-модель (напр. локальний omlx) прокидається в chain.note() коректно, окремий бакет unknownCalls замість неявного cloud

## [0.14.5] - 2026-07-12

### Fixed

- runBunCoverage: --parallel для ізоляції test-файлів

## [0.14.4] - 2026-07-11

### Fixed

- `measureCoveragePerFile`: не додавати `--coverage.exclude=**/*.d.ts` на CLI, коли target-проєкт має власний локальний vitest + `vitest.config.js` — CLI-флаг повністю замінює (не мерджить) масив `test.coverage.exclude` із конфіга проєкту, через що тихо затирались власні винятки (напр. bun-native-тести, що можуть виконуватись лише під `bun test`) і колектор помилково бачив уже покриті файли як 0%, намагаючись згенерувати для них нові тести. У bundled/shim-режимі (без локального vitest) флаг лишається — там немає стороннього конфіга для затирання.

## [0.14.3] - 2026-07-11

### Changed

- feat(coverage): bun-native workspace підтримка — coverage через `bun test`

## [0.14.2] - 2026-07-11

### Changed

- fix(coverage): окремий lock-ключ для --changed vs full-режиму

## [0.14.1] - 2026-07-11

### Changed

- fix(coverage): самодостатній JS-колектор — без залежності від @nitra/cursor providers

## [0.14.0] - 2026-07-11

### Added

- Ланцюжки (chains) @nitra/llm-lib ^1.1.0: mutant-classify — chain per mutant (tier1/tier2 = кроки, cache hit без chain), test-generate — chain per file (header + local/cloud спроби + vitest/length-retry = кроки), test-fix — chain per прогін (batch-виклики = кроки); адаптер callText/callAgent прокидає opts.chain. Аналітика ланцюжків — n-llm-chains-report і вкладка «Ланцюжки» в myllm.

### Changed

- підняти @7n/llm-lib до ^2.0.2 (rename @nitra/llm-lib → @7n/llm-lib уже застосовано в dacc051; нова мажорна версія без змін API — chains/компресія/body-capture, лише перейменування пакета)

## [0.13.0] - 2026-07-05

### Changed

- lock
- Ф3 виносу LLM-шару: @7n/test переведено на @nitra/llm-lib. pi-client.mjs (власний SDK-плюмбінг, exponential backoff, memory-retry 15/30/60с) і prompt-budget.mjs видалено; замість них тонкий адаптер lib/llm.mjs (callText/callAgent) поверх runOneShot/runAgentSkill пакета і budgetFor/capText/packBatch з @nitra/llm-lib/prompt-budget. Політика строго fail-fast: knobs N_PI_RETRY_*/N_PI_MEMORY_RETRY_* видалено, лишилось одноразове подвоєння maxTokens на stopReason:'length'. coverage-fix переведено зі spawnSync pi CLI на SDK-embed агента. Тир-резолюцію централізовано (LOCAL_MIN/CLOUD_MIN/CLOUD_MAX з @nitra/llm-lib/model-tiers; classify приймає інжектовні tier1/tier2). УВАГА: потребує опублікованого @nitra/llm-lib >= 1.0.0 (мердж cursor#llm-lib-extraction перед релізом).

## [0.12.2] - 2026-07-05

### Changed

- test(core): інваріантні тести маршрутизації gen-tests (local→cloud fallback, complex→cloud) замість сирих лічильників викликів; переписаний тест n-cursor-adr pi-extension

## [0.12.1] - 2026-07-04

### Changed

- test(core): моки node:fs під vitest-shim і актуалізація shouldDedup-очікування

## [0.12.0] - 2026-07-04

### Added

- 🤖 feat(core): спільний prompt-budget (бюджет символів + per-call maxTokens за типом задачі через streamFn-обгортку), батчинг fix-tests під бюджет з анти-starvation, повтор на обрізану генерацію (stopReason length)

### Fixed

- 🤖 fix(core): coverage-скан виключає `**/*.d.ts` — vitest 4 прибрав дефолтний exclude, і v8-remap падав із RolldownError на TS-синтаксисі декларацій у цільових проєктах (CLI-прапорець у coverage-per-file та exclude у shim-конфігу)
- CLI більше не висить після завершення роботи: явний process.exit у bin (незакриті pi-сесії тримали event loop) і session.dispose() у finally для callText/callAgent

## [0.11.2] - 2026-07-04

### Fixed

- 🤖 fix(core): кап runtime-probe виходів (shape-summary + tmp-cwd) і bounded backoff на omlx memory-guard замість миттєвого падіння

## [0.11.1] - 2026-07-04

### Changed

- 🤖 fix(core): omlx memory-guard помилка тепер друкує тіло запиту й завершує процес замість retry

## [0.11.0] - 2026-07-03

### Changed

- chore(deps): major-оновлення — @nitra/cursor 13.2.6→14.4.5 (unified lint surface + прогрес-бар), vitest 3→4.1.9 і @vitest/coverage-v8 3→4 (include замість видаленого coverage.all у config/shim/per-file), @stryker-mutator/vitest-runner 8→9.6.1 (+ explicit @stryker-mutator/core exact-peer у root), zod 3→4.4.3 (без правок коду)

## [0.10.3] - 2026-07-03

### Added

- COVERAGE.md тепер записується і при --no-mutation: береться per-file line coverage з останньої ітерації циклу тестування (без мутаційних даних) замість повного пропуску запису звіту.

## [0.10.2] - 2026-07-02

### Fixed

- resolveLocalModel (gen-tests.mjs) помилково трактував checkEnv() з @nitra/check-env як гетер значення змінної середовища — насправді це лише валідатор наявності, що завжди повертає undefined на успіху. Через це N_LOCAL_MIN_MODEL ігнорувався і двоярусна генерація (local+cloud) ніколи не вмикалась, навіть за коректно заданої змінної — завжди йшов fallback у single-file (cloud) режим. Замінено на пряме читання process.env.N_LOCAL_MIN_MODEL.

## [0.10.1] - 2026-07-02

### Fixed

- callText і callAgent (pi-client) тепер ретраять transient-помилки з'єднання (напр. до локального omlx-сервера під навантаженням) з експоненційним backoff + jitter замість негайного провалу файлу; кількість спроб і базова затримка налаштовуються через N_PI_RETRY_ATTEMPTS / N_PI_RETRY_DELAY_MS.

## [0.10.0] - 2026-07-02

### Changed

- Оновлено залежність @nitra/check-env до ^4.0.0

### Fixed

- Coverage/gen-tests/fix-tests тепер віддають перевагу локально встановленому vitest цільового проєкту замість підміненого шим-конфіга: власний vitest.config.js (setupFiles, environment, plugins) і провайдери оточення (happy-dom тощо) з node_modules цільового проєкту більше не ігноруються.

## [0.9.1] - 2026-07-02

### Changed

- docs

### Fixed

- Виніс спільний парсинг vitest failure у `coverage-per-file.mjs` і перевів `fix-tests.mjs` на його повторне використання, щоб прибрати jscpd-дубль.
- - Зменшено cognitive complexity генерації тестів через винесення підготовки контексту та tiered block generation у менші helper-и.
- - Виправлено JSDoc-описи та спрощено цикл генерації тестових блоків, щоб пройти JS lint для `gen-tests.mjs`.

## [0.9.0] - 2026-06-28

### Changed

- В нормальному циклі `assessNeed` (LLM-оцінка) повністю прибрано: coverage % < порогу є достатнім сигналом для генерації тестів. У bootstrap-режимі тепер використовується тільки `quickClassify` (локально, без LLM). Таким чином нульова кількість LLM-викликів до `assessNeed` у будь-якому сценарії.

## [0.8.0] - 2026-06-28

### Added

- `assessNeed` тепер запускає локальні JS-евристики перед LLM-викликом: файли-реекспорти (`export { } from`) класифікуються як `needsTests:false`, файли з функціями та гілками — як `needsTests:true`, без будь-яких витрат на API. LLM викликається тільки для неоднозначних файлів. Нова публічна функція `quickClassify(content)` доступна для тестування/розширення.

## [0.7.2] - 2026-06-27

### Fixed

- Виправлено парсинг JSON-репорту vitest 4.x: поле `name` замість `testFilePath` (breaking change у vitest JSON reporter). Наслідок: падаючі тести тепер коректно детектуються і передаються у fix-loop замість bootstrap.

## [0.7.1] - 2026-06-27

### Fixed

- `parseFailingTests` тепер коректно обробляє module-level помилки (import/syntax errors) — тести, що падають ще до запуску (`assertionResults: []`), більше не пропускаються, що усувало нескінченну bootstrap-петлю.

## [0.7.0] - 2026-06-27

### Added

- Bootstrap-режим: якщо тестів нема взагалі (`files=[]`, `failingTests=[]`), `@7n/test` тепер сканує джерельні файли, оцінює потребу через LLM і генерує початкові тести — замість зупинки з попередженням. Прибрано бінарний аліас `test` із bin-поля — залишено лише `7n-test`, що усуває конфлікт з shell built-in при `npx @7n/test`.

## [0.6.0] - 2026-06-27

### Added

- `vitest` і `@vitest/coverage-v8` тепер є залежностями `@7n/test` — цільовий проєкт більше не потребує їх у `devDependencies`. Vitest викликається з node_modules самого пакету через `process.execPath`. Додано бінарний аліас `7n-test` поряд з `test` — усуває конфлікт з shell built-in при `npx @7n/test`.

## [0.5.0] - 2026-06-27

### Changed

- `measureCoveragePerFile` тепер повертає `{ files, failingTests }` — vitest coverage і JSON reporter запускаються в одному виклику. `run.mjs` перевіряє `failingTests` щоразу перед покриттям (не лише коли coverage порожня), автоматично викликає pi agent і повторює ітерацію при успішному виправленні.

## [0.4.3] - 2026-06-26

### Changed

- Видалено зайвий бінарний аліас `7n-test` — залишено лише `test` для `npx @7n/test .`.

## [0.4.2] - 2026-06-26

### Changed

- Додано бінарний аліас `test` — тепер `npx @7n/test .` працює напряму (npx використовує частину після `/` у скоупному пакеті).

## [0.4.1] - 2026-06-26

### Changed

- Перейменовано бінарник з `n` на `7n-test`: тепер `npx 7n-test .` і `npx 7n-test@latest .` працюють без `--package=` флагу.

## [0.4.0] - 2026-06-26

### Added

- Додано `fix-tests.mjs`: виявляє падаючі unit-тести через vitest JSON reporter і викликає pi-агента для їх виправлення. Інтегровано в основний пайплайн `run.mjs` — якщо coverage порожня після першої ітерації, автоматично запускається фаза виправлення тестів.

## [0.3.2] - 2026-06-26

### Fixed

- Виправлено відсутність `src/coverage/coverage.mjs` у npm-пакеті: директорія ігнорувалась git через паттерн `**/coverage/` у `.gitignore`. Додано виняток `!npm/src/coverage/`.

## [0.3.1] - 2026-06-26

### Changed

- fix: unignore npm/src/coverage/ (was blocked by \*\*/coverage/ in .gitignore)

## [0.3.0] - 2026-06-26

### Changed

- Виправлено пакування: тест-файли (`*.test.mjs`) виключені з npm-артефакту через negation-патерн у `files`. Додано `@earendil-works/pi-coding-agent` до `dependencies`. CI: додано `workflow_dispatch` тригер і Trusted Publisher (OIDC provenance) для беззастосного публікування без `NPM_TOKEN`.

## [0.2.0] - 2026-06-26

### Changed

- Міграція на чистий pi SDK: видалено прямі HTTP-виклики oMLX (`omlx.mjs`, `llm.mjs`, `models.mjs`, `omlx-trace.mjs`), весь LLM-трафік тепер іде через `@earendil-works/pi-coding-agent` via `callText` у `pi-client.mjs`. Додано опційний параметр `model` до `callText`. Моделі tier1/tier2 беруться з `N_LOCAL_MIN_MODEL`/`N_CLOUD_MIN_MODEL`.
