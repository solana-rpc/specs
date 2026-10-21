# getSlotLeaders

Returns the leaders for a range of slots.

## Semantics

The array is ordered by slot, starting at `startSlot`. Agave rejects a limit above its `MAX_GET_SLOT_LEADERS` constant with `InvalidParams` (-32602).

## Implementation notes

- [**Agave**](../../implementations/agave.md): reference implementation. See the pinned [request handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L3162-L3181) and [processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L998-L1022).
