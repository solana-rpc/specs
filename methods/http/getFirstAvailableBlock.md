# getFirstAvailableBlock

Returns the lowest slot for which the node can serve block data. The result is a bare slot number and the method takes no parameters.

## Semantics

- This reports the node's retained history floor, not the first slot ever produced by the cluster.
- The value can increase when the node purges old ledger or archival data.
- Clients that request older block data should compare their slot with this result before treating an unavailable block as a transient error.

## Implementation notes

- [**Agave**](../../implementations/agave.md): reference implementation. See the pinned [request handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L4327-L4330) and [processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L2034-L2044).
- [**Superbank**](../../implementations/superbank.md): reports the oldest slot in ClickHouse block metadata. It returns `null` before any block metadata is available, although the standard result is a slot number.
