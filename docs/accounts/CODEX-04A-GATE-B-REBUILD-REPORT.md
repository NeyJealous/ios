# CODEX-04A Gate B Rebuild Report

## Zero-API rebuild

The official local Recalc pipeline rebuilt FIFO, Portfolio, Visualization, Market Regime, Strategy Targets, Tax, Rebalance, TradePlan, Decisions, Portfolio Health, Portfolio Intelligence, Advisor, Stabilization, Diagnostics and Main.

- Broker API calls: 0
- Trades writes: 0
- Operations writes: 0
- Target derived/UI rows after rebuild: 0
- Directory semantic digest unchanged: yes
- Account Strategy links semantic digest unchanged: yes
- Trades semantic digest unchanged during Recalc: yes

## Idempotency incident and correction

The raw second-pass digest differed only on Stabilization and Main. Main differed only in its explicit date/time row. Stabilization also exposed a real stateful diagnostic: its text reported the cumulative number of timed TechLog rows while every Stabilization run itself appended another timed log row.

The diagnostic was made idempotent by reporting availability of timing measurements instead of the cumulative count. The verifier ignores only approved volatile fields (updated timestamps, duration, Run ID and Main's date/time value). A convergence step followed by a scoped `stabilization → diagnostics → main` verification produced identical normalized business data.

- Final idempotency: PASS
- Allowed volatility only: yes
- Final status: `COMMITTED`

## Resulting aggregates

- Calculation portfolio rows: 1
- Calculation market value: 12,986.88 RUB
- Portfolio Health aggregate: 12,986.88 RUB
- Reconciliation delta: 0.00 RUB
- FIFO lots: 6
- FIFO sales: 0
- Portfolio Health rows: 3
- Stale target label in Portfolio Health: false
