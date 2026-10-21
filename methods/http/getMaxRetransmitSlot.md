# getMaxRetransmitSlot

Returns the node-local retransmit watermark.

## Semantics

This is a local telemetry value loaded from the node max_slots.retransmit atomic counter. It is not a cluster commitment or a guarantee that the slot is rooted.

## Implementation notes

- [**Agave**](../../implementations/agave.md): reference implementation. See the pinned [handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L3858-L3861).
