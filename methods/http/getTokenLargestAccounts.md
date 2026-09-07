# getTokenLargestAccounts

Returns the 20 token accounts with the largest balance for one SPL Token or Token-2022 mint.

## Parameters

The first parameter is the mint pubkey. The optional configuration selects commitment. Commitment defaults to `finalized`.

## Result

The result is an `RpcResponse` containing at most 20 entries ordered by descending token amount. Each entry contains the token-account address and the same exact and display amount fields as `getTokenAccountBalance`.

## Errors

An invalid pubkey, missing mint, non-token mint, or malformed mint account returns `InvalidParams` (-32602).

## Implementation notes

- [**Cloudbreak**](../../implementations/cloudbreak.md) serves configured mints from a maintained top-20 record and other mints from a live SQL scan. It rejects `processed` with -32003 or serves confirmed state when configured to downgrade. Wire ordering on both paths needs a conformance test.
