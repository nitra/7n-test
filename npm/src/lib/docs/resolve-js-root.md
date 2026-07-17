---
type: JS Module
title: resolve-js-root.mjs
resource: npm/src/lib/resolve-js-root.mjs
docgen:
  crc: 270edc8d
  model: omlx/gemma-4-e4b-it-OptiQ-4bit
  tier: local-min-retry
  score: 100
  judgeModel: openai-codex/gpt-5.4-mini
---

## Огляд

Файл визначає корені JavaScript-коду в проєкті, використовуючи конфігурацію `package.json`. Він знаходить єдиний корінь для однопакетного проєкту або всі корені для проєктів з багатопакетною структурою, підтримуючи glob-патерни (наприклад, `cf/*`) для workspace-проєктів.

## Поведінка

Поведінка:
resolveJsRoot повертає абсолютний шлях до кореня JavaScript-коду, якщо він визначений, інакше повертає null.
resolveAllJsRoots повертає список абсолютних шляхів до всіх коренів JavaScript-коду у проєкті, враховуючи конфігурацію `workspaces` з `package.json`.

## Публічний API

resolveJsRoot — знаходить основний корінь проєкту, де розташований `package.json`.
resolveAllJsRoots — надає повний список усіх JS-коренів у проєкті. Для багатопакетних (workspace) структур повертає кожен окремий workspace з його `package.json`; для одного пакета — поточний робочий каталог; повертає порожній масив, якщо `package.json` відсутній у корені.

## Гарантії поведінки

- Read-only: не виконує операцій запису (ФС/БД).
- Свідомо пропускає шляхи: `.git`, `node_modules`.
