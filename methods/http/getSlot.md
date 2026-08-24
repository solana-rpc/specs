# getSlot

Returns the current slot at the requested commitment level. The result is a
bare integer — this method does **not** use the RpcResponse context envelope.

## Semantics

- `commitment` defaults to `finalized`, so the default result trails the
  node's `processed` slot.
- `minContextSlot` is honoured here as elsewhere: if the slot at the requested
  commitment is below it, the node returns `MinContextSlotNotReached` (-32016)
  rather than a slot.

## Implementation notes

- **cloudbreak** and **superbank** both reject `processed` commitment by
  default (cloudbreak: -32003; superbank: -32602 unless built with the
  `grpc-head-cache` feature and configured with a head cache).
- Database-backed implementations approximate commitment from stored slot
  status rather than live bank state.
