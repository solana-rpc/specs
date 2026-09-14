# isBlockhashValid

Returns whether `blockhash` is still in the selected bank's recent-blockhash queue and can therefore be used in a transaction. A false result is a normal answer; it means the hash is unknown to that bank or has expired.

## Semantics

- `blockhash` must be a base58-encoded 32-byte hash. An invalid encoding or length returns `InvalidParams` (-32602).
- The default commitment is `finalized`. A sender normally checks the same commitment used to obtain the blockhash, commonly `processed` or `confirmed`.
- The result's `context.slot` identifies the bank whose recent-blockhash queue was tested. `value` is true only while the hash remains in that queue.
- `minContextSlot` requires that bank to be at or beyond the supplied slot. Otherwise the method returns `MinContextSlotNotReached` (-32016) with `data.contextSlot`.

## Implementation notes

- [**Agave**](../../implementations/agave.md): reference implementation. See the pinned [request handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L4370-L4379) and [processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L2465-L2473).
- [**Superbank**](../../implementations/superbank.md): tests a recent-block window over ClickHouse-stored blocks. `processed` requires the optional gRPC head cache; without it, the method serves `confirmed` and `finalized` views only. A retained blockhash outside the processing-age window returns false.
