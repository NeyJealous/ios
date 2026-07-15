# CODEX-03 Performance Report

- DataCache stale flags were converted from per-row `setValue` to batch `setValues`.
- Trades existing history is read once and indexed by composite TradeKey/checksum.
- Recalc diagnostics build Portfolio/Rebalance/TradePlan/Health previews in memory and do not publish derived sheets.
- Critical derived modules continue to write prepared arrays with `setValues`.
- Repeated clears and formatting outside the synchronization critical path were not globally refactored.
- Local syntax/static/performance assertions pass.
- Recalc: 1,043,361 ms and 2,060,890 ms; API 0/0.
- Quick: 577,127 ms and 655,440 ms; API 22/22.
- Full run 1: 3,529,865 ms, API 29, rows written 11,661.
- Full run 2: API 18, rows written 11,658. Its wall duration includes a multi-day
  checkpoint pause and is not representative of active runtime.
- Full remains the principal timeout risk. Checkpoint continuation avoided replaying
  completed history/API steps.
