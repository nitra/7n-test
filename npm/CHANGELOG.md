# Changelog

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
