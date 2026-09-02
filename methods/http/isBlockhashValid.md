# isBlockhashValid

Returns whether `blockhash` is still in the selected bank's recent-blockhash queue and can therefore be used in a transaction. A false result is a normal answer; it means the hash is unknown to that bank or has expired.

## Semantics

- `blockhash` must be a base58-encoded 32-byte hash. An invalid encoding or length returns `InvalidParams` (-32602).
- The default commitment is `finalized`. A sender normally checks the same commitment used to obtain the blockhash, commonly `processed` or `confirmed`.
- The result's `context.slot` identifies the bank whose recent-blockhash queue was tested. `value` is true only while the hash remains in that queue.
- `minContextSlot` requires that bank to be at or beyond the supplied slot. Otherwise the method returns `MinContextSlotNotReached` (-32016) with `data.contextSlot`.

## Implementation notes

- **superbank**: tests a recent-block window over ClickHouse-stored blocks. `processed` requires the optional gRPC head cache; without it, the method serves `confirmed` and `finalized` views only. A retained blockhash outside the processing-age window returns false.
- **cloudbreak**: method not served.
