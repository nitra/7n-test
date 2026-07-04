---
status: accepted
date: 2026-07-04
decision-makers: vitaliytv
---

# Спільний prompt-budget, батчинг fix-tests і per-call maxTokens через streamFn-обгортку

## Контекст і постановка проблеми

Фаза 2 спеки `docs/specs/2026-07-04-omlx-prompt-budget.md` (Д3–Д5),
defense-in-depth після probe-капу (ADR 0001): без спільного бюджету
наступна «безлімітна секція» повторить клас проблеми; `fix-tests.mjs`
конкатенував усі падаючі файли в один промпт без ліміту;
`max_completion_tokens` завжди дорівнював стелі моделі (32768)
незалежно від задачі.

## Спайк: per-call maxTokens у SDK

`@earendil-works/pi-coding-agent` **не має** публічного per-call
параметра: `session.prompt(text, options)` не прокидає options у loop
config, `createLoopConfig` не форвардить довільні поля, а
`openai-completions.js` читає лише `options.maxTokens`. Однак
емпірично (перевірено на дроті через myllm-проксі): обгортка
`session.agent.streamFn`, що домішує `maxTokens` в options, **перекриває**
дефолт (32768 → 512 у реальному запиті). Це прийнятий seam —
приватний, тому ізольований в одній функції `applyMaxTokens`
(`pi-client.mjs`) з тестом на контракт.

## Рішення

### 1. `npm/src/lib/prompt-budget.mjs` — єдина точка правди

| taskKind | maxPromptChars | maxTokens |
|---|---|---|
| `header` | 8 000 | 2 048 |
| `block` | 40 000 | 8 192 |
| `single-file` | 60 000 | 16 384 |
| `fix` | 60 000 | 16 384 |

API: `budgetFor(kind)`, `capText(text, max)` (голова+хвіст+маркер),
`fitToBudget(chunks, max)` (обрізає→дропає низькопріоритетні chunks,
максимальний пріоритет захищений), `packBatch(items, max)` (батчинг
цілих одиниць, найменші першими).

### 2. `fix-tests.mjs` — батчинг замість «все й одразу»

`buildFixTestsBatch(failures, dir)` → `{prompt, included, deferred}`:
скільки файлів влазить у `budgetFor('fix')` — стільки в батч, решта в
`deferred`. Файл, що сам-один перевищує бюджет, отримує соло-промпт із
жорстким обрізанням (`capText`: source геть, помилки ≤ чверті бюджету,
тест-код ≤ половини) — ніколи не скипається мовчки. Цикл
`fixFailingTests`: спроби рахуються **per-file** (лише коли файл був у
батчі), відкладені файли йдуть першими наступного проходу
(анти-starvation). `buildFixTestsPrompt` збережено як сумісний API.

### 3. `pi-client.mjs` — `opts.maxTokens` + захист від обрізаної генерації

`callText(prompt, {maxTokens})` вмикає streamFn-обгортку; на
`stopReason: 'length'` — один повтор із подвоєною стелею (до
`MAX_TOKENS_CEILING` = 32768), щоб retry-цикли колера не палили спроби
на «invalid block» через обрізаний вихід. `gen-tests.mjs`/`fix-tests.mjs`
передають `budgetFor(kind).maxTokens` на кожен виклик (header/block/
single-file/fix).

## Наслідки

- `max_completion_tokens` на дроті тепер варіюється за типом задачі
  (2048 для header проти колишніх незмінних 32768).
- Великий набір одночасних падінь у fix-tests більше не дає одного
  гігантського промпту — кілька батчів під 60k символів.
- Ризик: seam через приватний `session.agent.streamFn` може зламатись
  при мажорному оновленні SDK — контрактні тести в
  `pi-client.test.mjs` впадуть першими; fallback (глобальне зниження
  `maxTokens` у `~/.pi/agent/models.json`) описаний у спеці (п. Д5/§6).
