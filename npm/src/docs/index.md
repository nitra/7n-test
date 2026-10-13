---
type: JS Module
title: index.js
resource: npm/src/index.js
docgen:
  crc: b3571dfe
  model: omlx/gemma-4-e4b-it-OptiQ-4bit
  score: 100
  issues: judge:inaccurate:0.98
  judgeModel: openai-codex/gpt-5.4-mini
---

## Огляд

CLI-диспетчер `@7n/test`: розбирає аргументи командного рядка й делегує роботу
відповідному режиму. Підтримує довідку (`--help`/`-h`), сабкоманду `coverage`
(повний вимір покриття + mutation testing, nightly-режим канону Storybook),
сабкоманду `storybook` (швидкий PR-гейт `vitest run --project=storybook` по всіх
Storybook-roots) і дефолтний auto-test flow по вказаній директорії.

## Поведінка

1. Викликається функція `run` з масивом CLI-аргументів; прапорці (`--…`) відокремлюються від позиційних.
2. За `--help`/`-h` друкується usage для всіх трьох режимів і повертається 0 без будь-якої роботи.
3. `coverage` делегує у coverage-CLI з поточною робочою директорією, прокидаючи `--fix` і `--changed`.
4. `storybook` делегує у швидкий PR-гейт канону Storybook з поточною робочою директорією.
5. Інакше виконується auto-test flow: директорія — перший позиційний аргумент (резолвиться в абсолютний шлях) або поточна; `--no-mutation` вимикає мутаційну фазу.
6. Повертається exit code обраного режиму.

## Публічний API

- `run` — єдина точка входу CLI (`bin/7n-test.js`); повертає exit code процесу.

## Гарантії поведінки

- (специфічних машинно-виведених гарантій немає)
