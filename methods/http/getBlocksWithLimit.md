# getBlocksWithLimit

Returns up to `limit` slots with blocks, starting at `startSlot`. The result is a sparse, ascending list: skipped slots do not consume the limit.

## Semantics

- The search begins at `startSlot` and stops when `limit` produced blocks have been found or the available range ends.
- `limit` must not exceed 500,000. A limit of zero returns an empty array.
- `commitment` defaults to `finalized`. `minContextSlot` prevents a node from serving an answer from an earlier context and returns `MinContextSlotNotReached` (-32016) when it cannot meet that bound.

## Implementation notes

- **superbank** reads slot metadata from ClickHouse. It rejects `processed` unless the optional gRPC head cache is enabled, and does not accept `minContextSlot`.
- **cloudbreak** does not serve the method.
