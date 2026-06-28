---
type: JS Module
title: verdict-schema.mjs
resource: npm/src/coverage-classify/verdict-schema.mjs
docgen:
  crc: ecf5dfe1
  model: omlx/gemma-4-e4b-it-OptiQ-4bit
  score: 100
  issues: judge:inaccurate:0.98
  judgeModel: openai-codex/gpt-5.4-mini
---

## Огляд

Цей файл визначає `VerdictSchema` для структурованого відображення результатів класифікації, які генерує LLM-класифікатор (coverage-classify). Функція `parseVerdict` відповідає за вилучення та валідацію JSON-структури з необробленого тексту відповіді LLM, що дозволяє класифікувати вихід у категорії: `worth-testing`, `equivalent`, `defensive`, `glue` або `wrapper`.

## Поведінка

VerdictSchema: Визначає структуру даних для результатів класифікації, отриманих від LLM.
parseVerdict: Витягує та перевіряє відповідність JSON-об'єкта з текстової відповіді LLM визначеній схемі.

## Публічний API

VerdictSchema — схема, що описує очікувану структуру відповіді від LLM.
parseVerdict — видобуває та перевіряє відповідь від LLM щодо відповідності схемі VerdictSchema.

## Гарантії поведінки

- Read-only: не виконує операцій запису (ФС/БД).
