---
type: JS Module
title: classify-exports.mjs
resource: npm/src/classify-exports.mjs
docgen:
  crc: 0960206d
  model: omlx/gemma-4-e4b-it-OptiQ-4bit
  score: 100
  issues: judge:inaccurate:0.98
  judgeModel: openai-codex/gpt-5.4-mini
---

## Огляд

Визначає складність імпортованих елементів (named exports) з файлів JS/MJS на основі test-generation complexity. Це забезпечує маршрутизацію завдань: елементи з низькою складністю (trivial/simple) направляються до локальної LLM, а складні — до хмарної LLM. Публічний інтерфейс включає функції extractExportsWithComplexity та NAME.

## Поведінка

Поведінка
extractExportsWithComplexity обчислює складність імена експортів у файлі, щоб визначити, чи може завдання бути вирішене локальною чи хмарною моделлю.

## Публічний API

* extractExportsWithComplexity — Збирає всі іменовані експорти та класифікує кожен з них за рівнем складності тестування.
* NAME — [Сюди має бути стислий опис наміру файлу]

## Гарантії поведінки

- Read-only: не виконує операцій запису (ФС/БД).
