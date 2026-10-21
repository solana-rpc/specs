# getInflationGovernor

Returns the cluster inflation governor parameters.

## Semantics

All rate fields are decimal fractions, not percentages. The server reads the inflation configuration from the bank at the requested commitment.

## Implementation notes

- [**Agave**](../../implementations/agave.md): reference implementation. See the pinned [request handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L3134-L3141) and [processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L903-L916).
