# getInflationRate

Returns the current inflation rates.

## Semantics

All rate fields are decimal fractions, not percentages. Agave calculates the rate using its current bank and returns the epoch used for the calculation.

## Implementation notes

- [**Agave**](../../implementations/agave.md): reference implementation. See the pinned [request handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L3143-L3146) and [processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L910-L922).
