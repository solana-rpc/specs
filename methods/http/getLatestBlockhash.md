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

- [**Agave**](../../implementations/agave.md): baseline implementation. See the pinned [request handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L4361-L4368).
- **superbank**: served from ClickHouse-stored blocks; `processed` requires
  the `grpc-head-cache` feature.
- **cloudbreak**: method not served.
