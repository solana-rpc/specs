# getTokenSupply

Returns the current supply for one SPL Token or Token-2022 mint.

## Parameters

The first parameter is the mint pubkey. The optional configuration selects commitment. Commitment defaults to `finalized`.

## Result

The result is an `RpcResponse` containing `amount` as an exact base-10 integer string, the mint's `decimals`, nullable `uiAmount` as a JSON number, and `uiAmountString` as the exact display string. Clients should use `amount` for integer arithmetic and `uiAmountString` for display.

## Errors

An invalid pubkey, missing mint, non-token mint, or malformed mint account returns `InvalidParams` (-32602).

## Implementation notes

- [**Cloudbreak**](../../implementations/cloudbreak.md) supports SPL Token and Token-2022. It rejects `processed` with -32003 or serves confirmed state when configured to downgrade. Mints outside its configured index can produce Cloudbreak-specific error payloads.
