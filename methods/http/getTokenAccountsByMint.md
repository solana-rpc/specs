# getTokenAccountsByMint

Returns accounts owned by a selected program whose first 32 data bytes equal the supplied mint.

## Parameters

The first parameter is the mint pubkey. The optional configuration selects confirmed or finalized commitment, account encoding, data slicing, `minContextSlot`, and the account owner program. `programId` defaults to the legacy SPL Token program. Token-2022 clients must select the Token-2022 program.

## Result

The result is always an `RpcResponse` containing keyed accounts. It is equivalent to a contextual `getProgramAccounts` request against `programId` with a raw 32-byte memcmp filter at offset zero.

Result order follows the standard `getProgramAccounts` ordering contract. The method can return a large response and has no protocol pagination.

## Errors

Invalid pubkeys, configurations, and encodings return `InvalidParams` (-32602). A node that excludes the selected program returns `KeyExcludedFromSecondaryIndex` (-32010). A failed query returns `ScanError` (-32012). A lagging node returns `MinContextSlotNotReached` (-32016).

## Implementation notes

- [**Cloudbreak**](../../implementations/cloudbreak.md) ships this method as a streamed, GPA-backed extension. A database error after streaming begins can truncate the response instead of returning a JSON-RPC error object.
