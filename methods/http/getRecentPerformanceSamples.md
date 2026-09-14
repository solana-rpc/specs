# getRecentPerformanceSamples

Returns blockstore performance samples for recent slots.

## Semantics

The omitted limit defaults to Agave PERFORMANCE_SAMPLES_LIMIT value of 720. A limit above 720 is rejected with the JSON-RPC invalid-params error. numNonVoteTransactions is nullable to preserve compatibility with older serialized samples.

## Implementation notes

- [**Agave**](../../implementations/agave.md): reference implementation. See the pinned [handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L3742-L3766).
