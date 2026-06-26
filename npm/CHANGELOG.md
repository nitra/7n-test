# Changelog

## [0.3.1] - 2026-06-26

### Changed

- fix: unignore npm/src/coverage/ (was blocked by **/coverage/ in .gitignore)

## [0.3.0] - 2026-06-26

### Changed

- Виправлено пакування: тест-файли (`*.test.mjs`) виключені з npm-артефакту через negation-патерн у `files`. Додано `@earendil-works/pi-coding-agent` до `dependencies`. CI: додано `workflow_dispatch` тригер і Trusted Publisher (OIDC provenance) для беззастосного публікування без `NPM_TOKEN`.

## [0.2.0] - 2026-06-26

### Changed

- Міграція на чистий pi SDK: видалено прямі HTTP-виклики oMLX (`omlx.mjs`, `llm.mjs`, `models.mjs`, `omlx-trace.mjs`), весь LLM-трафік тепер іде через `@earendil-works/pi-coding-agent` via `callText` у `pi-client.mjs`. Додано опційний параметр `model` до `callText`. Моделі tier1/tier2 беруться з `N_LOCAL_MIN_MODEL`/`N_CLOUD_MIN_MODEL`.
