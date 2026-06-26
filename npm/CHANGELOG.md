# Changelog

## [0.2.0] - 2026-06-26

### Changed

- Міграція на чистий pi SDK: видалено прямі HTTP-виклики oMLX (`omlx.mjs`, `llm.mjs`, `models.mjs`, `omlx-trace.mjs`), весь LLM-трафік тепер іде через `@earendil-works/pi-coding-agent` via `callText` у `pi-client.mjs`. Додано опційний параметр `model` до `callText`. Моделі tier1/tier2 беруться з `N_LOCAL_MIN_MODEL`/`N_CLOUD_MIN_MODEL`.
