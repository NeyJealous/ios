# GS / JS Diff

| Base | Class | GS lines | JS lines | GS-only functions | JS-only functions | Remote | Risk | Archive JS | Decision |
|---|---|---:|---:|---|---|---|---|---|---|
| Accounts | JS_SUPERSET | 298 | 310 | — | — | matches_local_gs | HIGH | false | true |
| Advisor | GS_SUPERSET | 697 | 507 | — | — | matches_local_gs | MEDIUM | false | true |
| Api | IDENTICAL | 100 | 100 | — | — | matches_local_gs | LOW | true | false |
| BatchSync | GS_SUPERSET | 753 | 436 | TI_AutoMaintenanceSync, TI_MaintenanceSync, TI_QuickSync, TI_RecalculateRecommendations | — | matches_local_gs | MEDIUM | false | true |
| CompanyRating | GS_SUPERSET | 261 | 246 | — | — | matches_local_gs | MEDIUM | false | true |
| Config | IDENTICAL | 145 | 145 | — | — | matches_local_gs | LOW | true | false |
| Constitution | IDENTICAL | 285 | 285 | — | — | matches_local_gs | LOW | true | false |
| Core | GS_SUPERSET | 172 | 155 | — | — | matches_local_gs | MEDIUM | false | true |
| Data | GS_SUPERSET | 155 | 114 | — | — | matches_local_gs | MEDIUM | false | true |
| Diagnostics | GS_SUPERSET | 776 | 605 | — | — | matches_local_gs | MEDIUM | false | true |
| Directory | GS_SUPERSET | 1012 | 1003 | — | — | matches_local_gs | MEDIUM | false | true |
| DirectoryBatch | IDENTICAL | 253 | 253 | — | — | matches_local_gs | LOW | true | false |
| FIFO | IDENTICAL | 436 | 436 | — | — | matches_local_gs | LOW | true | false |
| Income | IDENTICAL | 211 | 211 | — | — | matches_local_gs | LOW | true | false |
| Inflation | IDENTICAL | 546 | 546 | — | — | matches_local_gs | LOW | true | false |
| Main | GS_SUPERSET | 404 | 387 | — | — | matches_local_gs | MEDIUM | false | true |
| MarketRegime | IDENTICAL | 129 | 129 | — | — | matches_local_gs | LOW | true | false |
| Menu | GS_SUPERSET | 157 | 133 | — | — | matches_local_gs | MEDIUM | false | true |
| Operations | GS_SUPERSET | 421 | 390 | — | — | matches_local_gs | MEDIUM | false | true |
| Portfolio | GS_SUPERSET | 405 | 386 | — | — | matches_local_gs | MEDIUM | false | true |
| Prices | GS_SUPERSET | 287 | 260 | — | — | matches_local_gs | MEDIUM | false | true |
| Rebalance | GS_SUPERSET | 711 | 707 | — | — | matches_local_gs | MEDIUM | false | true |
| Schema | GS_SUPERSET | 1342 | 1061 | — | — | matches_local_gs | MEDIUM | false | true |
| Settings | GS_SUPERSET | 338 | 292 | — | — | matches_local_gs | MEDIUM | false | true |
| Strategy | GS_SUPERSET | 486 | 460 | — | — | matches_local_gs | MEDIUM | false | true |
| StrategyEngine | IDENTICAL | 168 | 168 | — | — | matches_local_gs | LOW | true | false |
| Tax | JS_SUPERSET | 179 | 181 | — | — | matches_local_gs | HIGH | false | true |
| TradePlan | JS_SUPERSET | 694 | 726 | — | — | matches_local_gs | HIGH | false | true |
| Trades | IDENTICAL | 314 | 314 | — | — | matches_local_gs | LOW | true | false |
| Utils | IDENTICAL | 82 | 82 | — | — | matches_local_gs | LOW | true | false |
| Visualization | GS_SUPERSET | 266 | 266 | — | — | matches_local_gs | MEDIUM | false | true |

Non-identical pairs require semantic review before any legacy `.js` archival or removal.
