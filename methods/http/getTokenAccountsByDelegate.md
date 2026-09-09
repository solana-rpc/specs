# getTokenAccountsByDelegate

Returns token accounts whose approved delegate matches the supplied address.

## Parameters

The first parameter is the delegate pubkey. The second parameter selects either one mint or one token program. The optional third parameter controls commitment, account encoding, data slicing, and `minContextSlot`.

The `programId` filter accepts the SPL Token program or Token-2022. Any other program is invalid. The `mint` filter derives the token program from the mint account.

## Result

The result is an `RpcResponse` whose value is an array of keyed token accounts. Every returned token account has the supplied delegate in its initialized delegate field and matches the requested mint or token program.

The reference implementation uses the same account encoding and fallback rules as `getTokenAccountsByOwner`. An owner program without a parser falls back to the binary tuple when `jsonParsed` is requested.

## Errors

Invalid pubkeys, filter shapes, token programs, and encodings return `InvalidParams` (-32602). A node that excludes the requested secondary-index key returns `KeyExcludedFromSecondaryIndex` (-32010). A scan failure returns `ScanError` (-32012). A lagging node returns `MinContextSlotNotReached` (-32016).

## Implementation notes

- [**Cloudbreak**](../../implementations/cloudbreak.md) supports SPL Token and Token-2022 through a shared owner/delegate handler. It rejects `processed` with -32003 or serves confirmed state when configured to downgrade. It accepts but does not enforce `minContextSlot`. Cloudbreak does not impose a final pubkey order across all query and encoding paths; live tests must establish the returned order.
