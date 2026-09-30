# getEpochInfo

Returns information about the current epoch.

## Semantics

Agave selects the bank at the requested commitment. It returns a bare `EpochInfo` object; `transactionCount` is null when the selected bank has no count.

## Implementation notes

- [**Agave**](../../implementations/agave.md): reference implementation. See the pinned [request handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L2909-L2917) and [processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/runtime/src/bank.rs#L6131-L6140).
