# getHighestSnapshotSlot

Returns the highest available full and incremental snapshot slots.

## Semantics

`full` identifies the highest complete full snapshot archive. `incremental` is null when no incremental archive is available for that full snapshot. A node with snapshot support disabled returns `NoSnapshot` (-32008).

## Implementation notes

- [**Agave**](../../implementations/agave.md): reference implementation. See the pinned [request handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L2959-L2990) and [processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L2959-L2990).
