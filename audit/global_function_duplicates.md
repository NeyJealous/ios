# Global Function Duplicates

## Summary

The baseline canonical `.gs` set contained three duplicate top-level names. The duplicate wrapper definitions were removed by the approved minimal diff; the canonical set now has zero duplicate top-level names.

| Function | Definitions | Static/dynamic callers | Body comparison | Recommended owner | Risk |
|---|---|---|---|---|---|
| `TI_AutoMaintenanceSync` | `AutoMaintenance.gs`, `BatchSync.gs` | `BatchSync.gs` trigger handler constant | Identical | `BatchSync.gs` | Low |
| `TI_MaintenanceSync` | `AutoMaintenance.gs`, `BatchSync.gs` | `Menu.gs` menu entry | Identical | `BatchSync.gs` | Low |
| `TI_AutoRefreshFastData` | `AutoMaintenance.gs`, `DataCache.gs` | Legacy handler constants in both modules | Same disabled-result behavior; `DataCache.gs` adds a defensive namespace guard | `AutoMaintenance.gs` | Medium |

## Applied minimal resolution

1. Removed only the duplicate wrappers `TI_AutoMaintenanceSync` and `TI_MaintenanceSync` from `AutoMaintenance.gs`; kept the identical wrappers in `BatchSync.gs`.
2. Removed only the duplicate `TI_AutoRefreshFastData` wrapper from `DataCache.gs`; kept the wrapper in `AutoMaintenance.gs`.
3. Do not change namespaces, parameters, sync steps, menu labels, trigger handler names, return values or user-visible behavior.
4. Re-run the top-level registry and syntax checks before any push.

## Evidence

- `TI_AutoMaintenanceSync` is referenced as `MAINTENANCE_HANDLER` by `BatchSync.gs`.
- `TI_MaintenanceSync` is called by the Apps Script menu in `Menu.gs`.
- `TI_AutoRefreshFastData` is retained only as a legacy disabled handler; `TI.AutoMaintenance` is defined by `AutoMaintenance.gs` and is loaded in the canonical push set.
- Apps Script dynamic entry points are preserved with the same global names.

## Rollback

Restore the three removed wrapper blocks from tag `codex-01-baseline-20260712` or the baseline ZIP. No internal implementation will be changed.
