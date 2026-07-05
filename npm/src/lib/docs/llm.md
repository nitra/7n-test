---
type: JS Module
title: llm.mjs
resource: npm/src/lib/llm.mjs
docgen:
  crc: cb7b3d2a
---

## Огляд

Тонкий адаптер @7n/test над пакетом `@nitra/llm-lib` (Ф3 спеки llm-lib-extraction у репо cursor): зберігає звичний контракт `callText`/`callAgent` для внутрішніх колерів (gen-tests, fix-tests, assess-need, coverage-classify, coverage-fix), а транспорт, registry і трасування повністю живуть у пакеті. Замінив колишній `pi-client.mjs` з власним SDK-плюмбінгом, retry/backoff і прямим omlx-HTTP.

## Поведінка

callText — одноразовий text-виклик без tools через `runOneShot`: повертає текст відповіді; кидає Error на будь-якій помилці виклику (fail-fast, без retry/backoff). Єдина локальна політика — одноразове подвоєння `maxTokens` (до стелі 32768) при обрізаній відповіді (`stopReason: 'length'`), без пауз.
callAgent — агентний виклик через `runAgentSkill` з повним tool-set (read/write/edit/bash/grep/find/ls): агент пише файли напряму, текст стрімиться у stdout; таймаут 900с (паритет зі старим spawnSync pi CLI); без стелі відповіді (`maxTokens: 0`). Кидає Error на помилці.
MEMORY_ERROR_RE — реекспорт з пакета: колери класифікують memory-guard помилку локального model-сервера (пробити нагору й завершити процес, а не ковтати як per-file помилку).

## Гарантії поведінки

- Жодних вбудованих retry/backoff: колишні knobs N_PI_RETRY_ATTEMPTS/N_PI_MEMORY_RETRY_ATTEMPTS тощо видалено (fail-fast політика пакета).
- Подвоєння maxTokens відбувається щонайбільше один раз на виклик.
- `opts.deps` прокидається у раннери пакета — тести інжектять фейк-сесії без pi.
