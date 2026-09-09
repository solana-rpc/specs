# getTokenAccountsByMint

Returns accounts owned by a selected program whose first 32 data bytes equal the supplied mint.

## Parameters

The first parameter is the mint pubkey. The optional configuration selects commitment, account encoding, data slicing, `minContextSlot`, and the token program. `programId` defaults to the legacy SPL Token program. When supplied, it must be either the legacy SPL Token program or Token-2022.

## Result

The result is always an `RpcResponse` containing keyed accounts. Its filtering semantics equal a contextual `getProgramAccounts` request against `programId` with a raw 32-byte memcmp filter at offset zero.

Result order is unspecified. The method can return a large response and has no protocol pagination.

## Errors

Invalid pubkeys, configurations, and encodings return `InvalidParams` (-32602). A node that excludes the selected program returns `KeyExcludedFromSecondaryIndex` (-32010). A failed query returns `ScanError` (-32012). A lagging node returns `MinContextSlotNotReached` (-32016).

## Implementation notes

- [**Cloudbreak**](../../implementations/cloudbreak.md) ships this method as a streamed extension. It currently accepts any indexed owner program rather than only the two token programs. It rejects `processed` with -32003 or serves confirmed state when configured to downgrade. A `minContextSlot` failure uses -32000 with null data. A database failure uses InternalError (-32603), or can truncate the response when it occurs after streaming begins.
