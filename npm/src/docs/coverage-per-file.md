---
type: JS Module
title: coverage-per-file.mjs
resource: npm/src/coverage-per-file.mjs
docgen:
  crc: bd6aa877
  model: openai-codex/gpt-5.4-mini
  tier: cloud-min
  score: 100
  issues: judge-refine:kept-original,judge:inaccurate:0.98
  judgeModel: openai-codex/gpt-5.4-mini
---

## Огляд

Файл збирає per-file coverage з Vitest у форматі lcov і список упалих тестів за один прогін `@7n/test`, щоб одночасно бачити прогалини покриття й проблемні тести без повторних запусків. Він fail-safe: перехоплює помилки й не кидає винятків назовні, а також кешує результати в межах прогону. Публічні точки входу: `parseFailingTests`, `measureCoveragePerFile`, `getUncoveredFiles`, `renderPerFileMarkdown`, `findSourceFiles`; пошук джерел свідомо пропускає `.git` і `node_modules`.

## Поведінка

parseFailingTests зчитує JSON-результати Vitest із test-results.json і зводить їх до короткого списку проблемних файлів, після чого measureCoveragePerFile поєднує цей список із покриттям з одного запуску Vitest: спочатку збирає per-file coverage через lcov, паралельно фіксує падіння тестів, і повертає обидва набори даних як спільний знімок прогону.

getUncoveredFiles працює як фільтр над уже зібраними метриками та відбирає лише файли нижче порога, щоб інші кроки могли швидко визначити прогалини без повторного запуску тестів. renderPerFileMarkdown перетворює цей самий набір coverage-рядків у Markdown-звіт для COVERAGE.md, коли мутаційне тестування пропущено і провайдери з .n-cursor.json не залучались.

findSourceFiles слугує початковим заповненням, коли coverage-даних ще немає: вона обходить дерево проєкту, ігнорує .git та node_modules, та повертає лише ті вихідні файли, які можна вважати придатними для unit coverage. Уся поведінка побудована fail-safe: помилки не виходять назовні, а кеш у межах одного прогону не дає дублювати роботу.

## Публічний API

- measureCoveragePerFile — Runs vitest coverage + JSON reporter in a single pass.
Returns per-file coverage and any failing tests detected in the same run.
- getUncoveredFiles — Files below the coverage threshold.
- renderPerFileMarkdown — Рендерить per-file line coverage як Markdown-таблицю без мутаційних даних.
Використовується для `COVERAGE.md`, коли мутаційне тестування пропущено
(`--no-mutation`) і провайдери `.n-cursor.json#rules` не викликались.
- findSourceFiles — Recursively finds source code files in a directory, excluding tests and
ignored directories. Used for bootstrap when no coverage data exists.
- parseFailingTests — витягує з `test-results.json` перелік тестів, які впали, щоб на їх основі формувати подальші дії
- Спирається на `test-results.json` і `.n-cursor.json`, щоб визначати актуальний стан запусків і пов’язувати його з локальними налаштуваннями роботи

## Гарантії поведінки

- Перехоплює помилки і не пропускає винятків назовні (fail-safe).
- Кешує результати в межах одного прогону.
- Свідомо пропускає шляхи: `.git`, `node_modules`.
