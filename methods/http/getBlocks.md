# getBlocks

Returns the slots that contain blocks in the inclusive range from `startSlot` through `endSlot`. Skipped slots are absent from the returned array.

## Semantics

- The result is sorted in ascending slot order. It contains only slots with a block at the requested commitment; it is not a dense sequence.
- `endSlot` is optional. When it is absent, the range ends at the highest slot the node can serve at the requested commitment.
- The range may span at most 500,000 slots. A larger range is invalid.
- `commitment` defaults to `finalized`. `minContextSlot` makes the node reject the request with `MinContextSlotNotReached` (-32016) instead of returning a result from an earlier context.

## Implementation notes

- [**Superbank**](../../implementations/superbank.md): reads slot metadata from ClickHouse. It rejects `processed` unless the optional gRPC head cache is enabled, and does not accept `minContextSlot`.
