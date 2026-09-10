# getBlockHeight

Returns the block height (count of blocks beneath the tip, NOT the slot
number) at the requested commitment. Bare integer result, no context
envelope.

## Semantics

- Block height and slot diverge whenever slots are skipped: every block
  increments the height, but not every slot produces a block. Compare
  `getSlot`, which counts slots.
- `minContextSlot` is evaluated against the slot backing the response, not
  against the returned height; a lagging node returns
  `MinContextSlotNotReached` (-32016).

## Implementation notes

- [**Agave**](../../implementations/agave.md): baseline implementation. See the pinned [request handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L2950-L2957).
- **superbank**: `processed` requires the `grpc-head-cache` build feature.
- **cloudbreak**: method not served.
