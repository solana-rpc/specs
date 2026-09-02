# getLatestBlockhash

Returns the most recent blockhash at the requested commitment, together with
`lastValidBlockHeight` — the last block height at which a transaction using
this blockhash will be accepted.

## Semantics

- `lastValidBlockHeight` is a **block height**, not a slot, and is compared
  against `getBlockHeight` when polling for expiry.
- Senders normally fetch at `confirmed` or `processed`: a `finalized`
  blockhash is already tens of slots into its validity window, shortening the
  time a transaction built on it can land.
- `minContextSlot` behaves as elsewhere; a lagging node returns
  `MinContextSlotNotReached` (-32016) instead of a stale blockhash.

## Implementation notes

- [**Superbank**](../../implementations/superbank.md): served from ClickHouse-stored blocks or the optional head cache. `processed` requires the `grpc-head-cache` build feature and an enabled, configured head cache.
