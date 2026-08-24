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

- **superbank**: `processed` requires the `grpc-head-cache` build feature.
- **cloudbreak**: method not served.
