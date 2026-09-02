# getBlockTime

Returns the estimated Unix timestamp, in seconds, for the block at `slot`. The result is a bare integer, not a context envelope.

## Semantics

- Validators record UTC timestamps in vote transactions. The reported block time is a stake-weighted estimate derived from those vote timestamps.
- A block can exist without a usable timestamp. In that case the result is `null`.
- The method takes exactly one slot parameter. A skipped slot has no block time and clients must not infer one from adjacent slots.

## Implementation notes

- [**Superbank**](../../implementations/superbank.md): reads block metadata from ClickHouse. A stored block with no timestamp returns `null`, but a missing or skipped slot returns `LongTermStorageSlotSkipped` (-32009) rather than `null`.
