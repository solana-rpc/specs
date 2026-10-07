# getTokenLargestAccounts

Returns the 20 token accounts with the largest balance for one SPL Token or Token-2022 mint.

## Parameters

The first parameter is the mint pubkey. The optional configuration selects commitment. Commitment defaults to `finalized`.

## Result

The result is an `RpcResponse` containing at most 20 entries ordered by descending token amount. Each entry contains the token-account address and the same exact and display amount fields as `getTokenAccountBalance`.

## Errors

An invalid pubkey, missing mint, non-token mint, or malformed mint account returns `InvalidParams` (-32602).

## Implementation notes

- [**Agave**](../../implementations/agave.md): reference implementation. See the pinned [request handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L3526-L3537) and [processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L2117-L2171).
- [**Cloudbreak**](../../implementations/cloudbreak.md) serves configured mints from a maintained top-20 record and other mints from a live SQL scan. It rejects `processed` with -32003 or serves confirmed state when configured to downgrade. Wire ordering on both paths needs a conformance test.
