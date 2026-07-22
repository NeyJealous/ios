# Investment Operating System (IOS)
## Master Specification v4.0 — Audit Baseline

**Дата:** 18 июля 2026 года  
**Статус:** Audit Baseline  
**Предшествующая версия:** v3.0 от 6 июля 2026 года  
**Каноническая ветка:** `integration/ios-current`

---

# AccountScope Specification

## Флаги

| Русское имя | Внутреннее имя |
|---|---|
| Синхронизировать | `Sync_Enabled` |
| Учитывать в расчётах | `Calculation_Enabled` |
| Показывать | `Display_Enabled` |
| Использовать в рекомендациях | `Recommendations_Enabled` |
| Хранить историю | `History_Enabled` |

## Контракт

```javascript
getAllAccounts()
getSyncEnabledAccountIds()
getCalculationEnabledAccountIds()
getDisplayEnabledAccountIds()
getRecommendationEnabledAccountIds()
getHistoryEnabledAccountIds()

isSyncEnabled(accountId)
isCalculationEnabled(accountId)
isDisplayEnabled(accountId)
isRecommendationEnabled(accountId)
isHistoryEnabled(accountId)
```

## Правила

- ключом является Account ID;
- неизвестный ID выключен;
- Recommendations без Calculation блокируются;
- фильтрация централизована;
- ID маскируются в diagnostics;
- отключение последнего расчётного счёта защищено validation guard.
