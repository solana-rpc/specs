# getBlockProduction

Returns block production statistics for a slot range.

## Semantics

`range` is inclusive. Each `byIdentity` tuple is `[leaderSlots, blocksProduced]`. With no range, Agave uses the current epoch from its first slot through the selected bank slot. It rejects an inverted range and ranges outside retained slot history with `InvalidParams` (-32602), and reports `NoSlotHistory` (-32021) when slot history is unavailable.

## Implementation notes

- [**Agave**](../../implementations/agave.md): reference implementation. See the pinned [request handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L3192-L3282) and [processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L998-L1022).
