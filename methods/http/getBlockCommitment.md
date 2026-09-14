# getBlockCommitment

Returns the cluster stake commitment accumulated for slot.

## Semantics

The commitment member is null when the node has no retained commitment record for the slot. Otherwise it is the fixed 32-entry array indexed by confirmation depth; each value is stake, not a percentage. totalStake is reported even when commitment is null.

## Implementation notes

- [**Agave**](../../implementations/agave.md): reference implementation. See the pinned [handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L3383-L3389).
