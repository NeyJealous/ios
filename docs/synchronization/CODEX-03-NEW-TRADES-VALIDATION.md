# CODEX-03 New Trades Validation

## Result

| Classification | Count |
|---|---:|
| `VALID_NEW_TRADE` | 13 |
| `DUPLICATE` | 0 |
| `INVALID` | 0 |
| `REQUIRES_REVIEW` | 0 |

All 13 rows have:

- an existing Account ID;
- an instrument identifier/ticker;
- valid ISO timestamps and numeric quantity/price/commission fields;
- currency and operation type;
- unique full-row SHA-256 checksums;
- distinct composite `Account ID + Operation ID + Trade ID` keys.

## Canonical key decision

One new row has Trade ID `1094`, matching an older trade, while its Operation ID,
timestamp, quantity and full-row checksum differ. It is a valid distinct trade.

The approved identity key is:

`Account ID + Operation ID + Trade ID`

The row with repeated Trade ID is classified `VALID_NEW_TRADE`. No deletion or
production correction was performed. Full technical IDs remain only
in Google Sheets; the audit artifact contains suffixes and hashes.
