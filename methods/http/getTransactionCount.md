# getTransactionCount

Returns the cumulative number of transactions processed by the bank at the requested commitment. The result is a bare unsigned integer, not an `RpcResponse` envelope and not a count restricted to a time range.

## Semantics

- The count includes every transaction processed by the selected bank, including failed transactions that reached execution.
- The default commitment is `finalized`. `processed` gives the current bank view, and `confirmed` gives the optimistically confirmed bank view.
- `minContextSlot` requires the selected bank to be at or beyond that slot. A node that has not reached it returns `MinContextSlotNotReached` (-32016) with `data.contextSlot`.
- The number is a monotonically increasing ledger counter. It can differ between commitment levels while recent slots have not finalized.

## Implementation notes

- **superbank**: derives the count from ClickHouse-stored blocks. It supports `confirmed` and `finalized`; `processed` requires the optional gRPC head cache. It rejects unknown config members with `InvalidParams`, while Agave ignores unknown serde fields.
- **cloudbreak**: method not served.
