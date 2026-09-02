# minimumLedgerSlot

Returns the lowest slot for which the node has ledger information. The result is a bare slot number and the method takes no parameters.

## Semantics

- This is a node-local retained-ledger floor. It can increase when the node purges older ledger data.
- It does not identify the first slot produced by the cluster and does not promise that every higher slot produced a block.
- Clients use this value to decide whether a historical request is outside a node's local retention window.

## Implementation notes

- [**Superbank**](../../implementations/superbank.md): reports the lowest slot in its ClickHouse-backed block storage. This is a retention-floor approximation, not an exact view of Agave's validator blockstore metadata. It returns `null` when the storage is empty.
