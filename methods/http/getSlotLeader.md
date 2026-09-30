# getSlotLeader

Returns the identity of the leader for the current slot.

## Semantics

The returned public key is the leader for the bank slot selected by `commitment`. `minContextSlot` is enforced before selection and can produce `MinContextSlotNotReached` (-32016).

## Implementation notes

- [**Agave**](../../implementations/agave.md): reference implementation. See the pinned [request handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L3153-L3160) and [processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L993-L997).
