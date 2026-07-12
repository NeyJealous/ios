# CODEX-03 Performance Report

- DataCache stale flags were converted from per-row `setValue` to batch `setValues`.
- Trades existing history is read once and indexed by composite TradeKey/checksum.
- Recalc diagnostics build Portfolio/Rebalance/TradePlan/Health previews in memory and do not publish derived sheets.
- Critical derived modules continue to write prepared arrays with `setValues`.
- Repeated clears and formatting outside the synchronization critical path were not globally refactored.
- Local syntax/static/performance assertions pass.
- Full-run timing and production write counts remain pending the final data-change gate.
