# getBlocksWithLimit

Returns up to `limit` slots with blocks, starting at `startSlot`. The result is a sparse, ascending list: skipped slots do not consume the limit.

## Semantics

- The search begins at `startSlot` and stops when `limit` produced blocks have been found or the available range ends.
- `limit` must not exceed 500,000. A limit of zero returns an empty array.
- `commitment` defaults to `finalized`. `minContextSlot` prevents a node from serving an answer from an earlier context and returns `MinContextSlotNotReached` (-32016) when it cannot meet that bound.

## Implementation notes

- [**Agave**](../../implementations/agave.md): reference implementation. See the pinned [request handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L4260-L4269) and [processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L1543-L1620).
- [**Superbank**](../../implementations/superbank.md): reads slot metadata from ClickHouse. It rejects `processed` unless the optional gRPC head cache is enabled, and does not accept `minContextSlot`.
