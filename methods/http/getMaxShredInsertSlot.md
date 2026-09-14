# getMaxShredInsertSlot

Returns the node-local shred insertion watermark.

## Semantics

This is a local telemetry value loaded from the node max_slots.shred_insert atomic counter. It does not establish confirmation or ledger availability.

## Implementation notes

- [**Agave**](../../implementations/agave.md): reference implementation. See the pinned [handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L3863-L3866).
