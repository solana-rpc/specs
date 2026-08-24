# getHealth

Returns `"ok"` when the node is healthy. When unhealthy, returns error
-32005 (`NodeUnhealthy`); when the node can determine how far behind it is,
the error's `data.numSlotsBehind` is set, otherwise it is `null`.

Note the asymmetry: health is the only standard method whose unhealthy state
is expressed as a JSON-RPC error rather than a result value.

## Semantics

- The method takes no parameters and returns a bare string — no config
  object, no commitment, no context envelope.
- `"ok"` is the only successful result value; clients should treat any other
  string as a protocol violation rather than as a health state.
- Health is a node-local judgement. Two nodes serving the same cluster may
  disagree, and "healthy" says nothing about whether a given slot or account
  is present in this node's storage.

## Implementation notes

- **Agave** defines healthy as being within `health_check_slot_distance` of
  the cluster's latest optimistically confirmed slot. When the node cannot
  tell how far behind it is, it still errors with -32005 and
  `data.numSlotsBehind: null`.
- **cloudbreak** reads a health flag maintained by its indexer; while a
  snapshot is loading, all slot-gated methods also fail with -32005.
- **superbank** reports healthy iff it can resolve a latest finalized slot
  from storage; `data.numSlotsBehind` is always `null`.
