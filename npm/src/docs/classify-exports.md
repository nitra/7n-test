---
type: JS Module
title: classify-exports.mjs
resource: npm/src/classify-exports.mjs
docgen:
  crc: af4ad450
  model: omlx/gemma-4-e4b-it-OptiQ-4bit
  score: 100
  issues: judge:inaccurate:0.99
  judgeModel: openai-codex/gpt-5.4-mini
---

## Огляд

Classifies named exports from a JS/MJS source file based on test-generation complexity. It directs exports—specifically via `extractExportsWithComplexity` and `NAME`—to appropriate LLMs: trivial/simple exports are sent to the local LLM, while complex ones are routed to the cloud LLM.

## Поведінка

Поведінка
extractExportsWithComplexity визначає, які імпортовані елементи файлу класифікувати для подальшої обробки, згруповуючи їх за рівнем складності тестування.
NAME визначає, які імпортовані елементи файлу класифікувати для подальшої обробки, згруповуючи їх за рівнем складності тестування.

## Публічний API

* extractExportsWithComplexity — Вибирає всі іменовані експорти та класифікує їх за складністю тестування.
* NAME — Описує основну функцію цього файлу.

## Гарантії поведінки

* Read-only: не виконує операцій запису (ФС/БД).
