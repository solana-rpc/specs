# minimumLedgerSlot

Returns the lowest slot for which the node has ledger information. The result is a bare slot number and the method takes no parameters.

## Semantics

- This is a node-local retained-ledger floor. It can increase when the node purges older ledger data.
- It does not identify the first slot produced by the cluster and does not promise that every higher slot produced a block.
- Clients use this value to decide whether a historical request is outside a node's local retention window.

## Implementation notes

- [**Agave**](../../implementations/agave.md): reference implementation. See the pinned [request handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L4229-L4232) and [processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L1034-L1045).
- [**Superbank**](../../implementations/superbank.md): reports the lowest slot in its ClickHouse-backed block storage. This is a retention-floor approximation, not an exact view of Agave's validator blockstore metadata. It returns `null` when the storage is empty.
