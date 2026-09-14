# getMinimumBalanceForRentExemption

Returns the minimum lamports required for rent exemption.

## Semantics

The server computes the amount from the rent configuration at the requested commitment. `dataLen` must not exceed the protocol maximum account data length; otherwise it returns `InvalidRequest` (-32600).

## Implementation notes

- [**Agave**](../../implementations/agave.md): reference implementation. See the pinned [request handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L3121-L3132) and [processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/runtime/src/bank.rs#L3461-L3466).
