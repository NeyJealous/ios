# IOS — полный комплект проекта, актуальная сборка

## Что находится в архиве

### 1. completion_pack

Актуальный план завершения IOS через Codex:

- подготовка чистой Windows;
- проверка инструментов;
- терминальный runtime;
- browser fallback;
- исправление `.gs/.js`;
- счета и стратегии;
- синхронизация;
- Investment Universe;
- Decision Engine;
- пользовательские листы;
- Reserve Engine;
- тесты и релиз.

### 2. master_specification

Master Specification v3.0:

- 00–14;
- 15.1–15.8;
- 16–28.

Известные противоречия исправляются файлом:

`completion_pack/ARCHITECTURE_CORRECTION_MEMO_v1.md`

### 3. audit_and_source_requirements

- статический аудит проекта;
- ТЗ Codex v2.2 по синхронизации и Investment Universe;
- ТЗ по многосчётности и резерву.

### 4. mission_control

- спецификация Mission Control;
- задача Codex по аудиту и визуальному атласу.

### 5. visual_materials

- Figma-ready SVG Architecture Atlas;
- интерактивный HTML;
- Mission Control Roadmap;
- прототип презентации.

### 6. source_snapshot

- `work(3).zip`;
- чистая версия инвестиционной таблицы.

Эти материалы являются исходным снимком для аудита. Не заменять ими рабочий Git-репозиторий без сравнения.

---

# С чего начать после чистой Windows

1. Открыть:
   `completion_pack/00_EXECUTION_ORDER_AFTER_WINDOWS_REINSTALL.md`
2. Выполнить CODEX-PRE-00.
3. Получить `ReadyForCodex00 = true`.
4. Выполнить CODEX-00.
5. Если терминальный runtime не настроился — выполнить CODEX-00B.
6. Продолжать CODEX-01—08 строго по очереди.

---

# Что передать Codex первым сообщением

```text
Прочитай AGENTS.md, 00A_WINDOWS_CLEAN_INSTALL_BOOTSTRAP.md,
ARCHITECTURE_CORRECTION_MEMO_v1.md и выполни только CODEX-PRE-00.
Не изменяй код проекта и не выполняй clasp pull/push до завершения проверки среды.
Сначала покажи найденные инструменты, версии и блокирующие проблемы.
```

---

# Статусы документов

- Master Specification v3.0 — текущий набор требований, но имеет известные противоречия.
- Architecture Correction Memo v1 — обязательная коррекция до v4.
- Completion Pack v3 — актуальный план выполнения.
- Визуальные карты v1 — прототипы, не доказательство готовности кода.
- Project Audit — статический аудит; runtime/API не проверены.
