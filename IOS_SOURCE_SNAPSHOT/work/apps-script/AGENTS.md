# Scoped Apps Script instructions

Наследовать корневые правила без ослабления. Production Apps Script менять
только в отдельно утверждённом gate. Запрещены `clasp push`, deployment и remote
execution без отдельного разрешения. Проверять batch I/O, отсутствие range/API
в циклах, LockService, JSON-safe entry points, rollback и privacy.
