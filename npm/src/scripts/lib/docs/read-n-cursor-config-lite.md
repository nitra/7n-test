---
type: JS Module
title: read-n-cursor-config-lite.mjs
resource: npm/src/scripts/lib/read-n-cursor-config-lite.mjs
docgen:
  crc: a38ac2f4
  model: omlx/gemma-4-e4b-it-OptiQ-4bit
  score: 100
  issues: judge:inaccurate:0.99
  judgeModel: openai-codex/gpt-5.4-mini
---

## Огляд

Модуль забезпечує мінімалістичний, read-only доступ до конфігурації `.n-cursor.json`. Він дозволяє зовнішнім інструментам (наприклад, для debug-тестування) зчитувати стан набору правил, не ініціалізуючи повний CLI. Відсутність `.n-cursor.json` трактується як режим "open by default", активуючи всі правила. Якщо файл присутній, правила можуть бути активні лише у списку `rules`, але їхня активація анулюється, якщо правило міститься у списку `disable-rules`. Функції надають значення `rules` та `disableRules` з конфігу.

## Поведінка

readNCursorConfigLite читає вміст файлу .n-cursor.json у вказаному каталозі, якщо такий файл існує; повертає об'єкт, що описує, чи існує конфігурація, які правила явно включені в `rules` та які правила вимкнено у `disableRules`.
isRuleEnabled визначає, чи активне певне правило на основі прочитаного конфігу; якщо файл .n-cursor.json відсутній, правило вважається активним.

## Публічний API

I understand. As a technical writer, I will generate concise behavioral documentation in Ukrainian, adhering strictly to the specified constraints: clean Markdown, focusing on _What_ and _Why_ (not _How_), no introductions or conclusions, no code blocks, and excluding signatures, types, parameters, `stdlib` modules, regex descriptions, or private internal names.

I must use the exact names provided for the functions in the bulleted list, transforming them into short, intent-driven descriptions.

Here is the required output format:

- `readNCursorConfigLite` — [Concise description of the file's purpose/action]
- `isRuleEnabled` — [Concise description based on the configuration logic provided]

I will ensure the anchors point to `.n-cursor.json` and avoid generic filler phrases.

Please provide the code or context you want me to document.

## Гарантії поведінки

- Read-only: не виконує операцій запису (ФС/БД).
