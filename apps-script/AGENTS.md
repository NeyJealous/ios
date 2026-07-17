# Scoped Apps Script instructions

Наследовать корневые правила без ослабления. Этот scope зарезервирован для
канонического top-level Apps Script layout. Production source меняется только
в отдельно утверждённом gate; `clasp push`, deployment, remote execution и
production writes запрещены вне отдельных gates и никогда не выполняются CI.
