---
type: JS Module
title: storybook-run.mjs
resource: npm/src/storybook-run.mjs
docgen:
  crc: 77a2da36
  model: openai-codex/gpt-5.4-mini
  tier: cloud-min
  score: 90
  issues: internal-name:isStorybookRoot,judge:inaccurate:0.95
  judgeModel: openai-codex/gpt-5.4-mini
---

## Огляд

Реалізує PR-половину канону Storybook для Vue-компонентних бібліотек: швидкий гейт `vitest run --project=storybook` як named vitest-проєкт, лише в browser-mode chromium, без coverage-інструментації та без mutation testing. Прогін охоплює workspace-roots із canonical Storybook-identity devDeps через `isStorybookRoot`. Якщо в репо немає жодного Storybook-пакета, `defaultRunner` і `runStorybookCli` дають чесний no-op з `exit 0`, щоб команду можна було безумовно вмикати в PR-workflow будь-якого репо.

## Поведінка

- `defaultRunner` — запускає швидкий PR-прогін Storybook через `vitest run --project=storybook` у корені кожного Storybook-пакета; вважає порожній Storybook-проєкт успішним, а для падіння повертає ненульовий exit code.
- `runStorybookCli` — знаходить усі Storybook-пакети в репозиторії, послідовно проганяє їх через `defaultRunner`, показує no-op для репо без Storybook-пакетів і повертає успіх лише тоді, коли всі прогони зелені.

## Публічний API

- defaultRunner — запусковий runner за замовчуванням, який можна підмінити в тестах; не валить PR-гейт, коли story-файлів ще немає
- runStorybookCli — запускає `@7n/test storybook` для всіх Storybook-root’ів; збирає результат у спільний exit code, навіть якщо один root падає

## Гарантії поведінки

- (специфічних машинно-виведених гарантій немає)
