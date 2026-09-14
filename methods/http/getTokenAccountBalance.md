# getTokenAccountBalance

Returns the token balance for one SPL Token or Token-2022 account.

## Parameters

The first parameter is the token-account pubkey. The optional configuration selects commitment. Commitment defaults to `finalized`.

## Result

The result is an `RpcResponse` containing `amount` as an exact base-10 integer string, `decimals` from the mint, nullable `uiAmount` as a JSON number, and `uiAmountString` as the exact display string. Clients should use `amount` for integer arithmetic and `uiAmountString` for display.

## Errors

An invalid pubkey, missing account, non-token account, or unavailable mint data returns `InvalidParams` (-32602).

## Implementation notes

- [**Agave**](../../implementations/agave.md): reference implementation. See the pinned [request handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L3392-L3401) and [processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L2054-L2076).
- [**Cloudbreak**](../../implementations/cloudbreak.md) supports SPL Token and Token-2022. It rejects `processed` with -32003 or serves confirmed state when configured to downgrade. Accounts and mints outside its configured index can produce Cloudbreak-specific error payloads.
