# Инвентаризация материалов CODEX-PRE-00

Дата: 12.07.2026

## Переданные файлы

- `IOS_FULL_PROJECT_BUNDLE_LATEST_v4_HANDOFF.zip` — 1 593 172 байта.
- `CODEX_MASTER_HANDOFF_IOS_v1.md` — 25 684 байта.

Архив распакован отдельно в `IOS_HANDOFF_v4`. Исходный snapshot распакован отдельно в `IOS_SOURCE_SNAPSHOT`; он не назначен автоматически рабочим репозиторием.

## Состав handoff

- 66 записей в ZIP.
- 65 файлов в `FILE_MANIFEST_v4.json` (манифест не включает сам себя).
- `completion_pack` — план PRE‑00 и CODEX‑00…08.
- `master_specification` — 00–14, 15.1–15.8, 16–28.
- `audit_and_source_requirements` — аудит и два ТЗ v2.2.
- `mission_control` — спецификация визуальной витрины и задача аудита.
- `visual_materials` — SVG, HTML, roadmap ZIP и PPTX.
- `source_snapshot` — `work(3).zip` и экспорт Google Sheets в XLSX.

## Обязательные документы

Найдены и прочитаны:

1. `00_START_HERE.md`.
2. `completion_pack/01_AGENTS.md`.
3. `completion_pack/ARCHITECTURE_CORRECTION_MEMO_v1.md`.
4. `completion_pack/CODEX_MASTER_HANDOFF_IOS_v1.md`.
5. `completion_pack/00A_WINDOWS_CLEAN_INSTALL_BOOTSTRAP.md`.
6. `completion_pack/02_CODEX_SEQUENTIAL_TASKS.md`.
7. `audit_and_source_requirements/project_audit_report.txt`.
8. `audit_and_source_requirements/ТЗ_Codex_v2.2_Синхронизация_Инвестиционная_вселенная.txt`.
9. `audit_and_source_requirements/ТЗ_Codex_v2.2_Расширение_архитектуры_счетов_и_резерва.txt`.
10. Старый `project-summary.md` из snapshot.

## Исходный snapshot

Путь: `IOS_SOURCE_SNAPSHOT/work`.

- `.gs`: 47.
- `.js`: 31.
- `.html`: 1.
- JSON в `apps-script`: 2.
- одноимённых пар `.gs/.js`: 31.
- файлов только `.gs`: 16.
- файлов только `.js`: 0.
- дополнительные каталоги: `bound-create`, `clean-*`, `schema-parts`.
- snapshot не содержит `.git` и не считается готовым рабочим репозиторием.

На PRE‑00 содержимое исходного кода не менялось, `clasp pull/push/run-function` не выполнялись.

## Google Sheets snapshot

Найден файл `Инвестиционный портфель - чистая версия.xlsx` внутри `source_snapshot`. На PRE‑00 он только учтён в инвентаризации; повторный аудит таблицы не выполнялся.

## Безопасность

- Чувствительные имена файлов (`.clasprc.json`, `client_secret*.json`, `credentials*.json`, `.env*`, `*.token`, `*.secret`) не найдены.
- По характерным сигнатурам приватных ключей, Google/GitHub API-ключей, client secret и Bearer-токенов совпадений не найдено.
- Значения Script ID и Spreadsheet ID не публиковались; в автоматическом отчёте сохранён только суффикс Script ID.

## Ограничения инвентаризации

- Handoff — снимок, а не подтверждённая актуальная production-копия.
- Runtime/API и связанная Google-таблица не проверялись.
- SHA-256 каждого файла против манифеста на этом этапе не сверялся.
- Рабочий корень проекта ещё не выбран и не собран.

