# getAccountInfo

Returns the account at the given address, or `null` inside a normal
RpcResponse envelope when the account does not exist.

## Return-type variants

The `value.data` field's wire shape depends on the request `encoding` —
see the `UiAccountData` schema for the three forms. With `jsonParsed`, an
account whose owner program has no parser falls back to the base64 tuple
form; consumers MUST handle both.

When `encoding` is omitted the reference implementation uses the legacy
`binary` encoding, whose data is a **bare base58 string**, not a
`[data, encoding]` tuple. Requesting `base58` explicitly returns the tuple
form. Clients that omit `encoding` must therefore accept the bare-string
variant.

## Semantics

- `dataSlice` applies to `base58`, `base64`, `base64+zstd`, and the legacy
  `binary` encoding. With `jsonParsed` it has no effect on parsed output; it
  is applied only when the request falls back to the base64 tuple form.
- `base58`/`binary` encoding errors when the data to return (after any
  `dataSlice`) exceeds 128 bytes. The reference implementation returns
  `InvalidRequest` (-32600) with the message
  `Encoded binary (base 58) data should be less than 128 bytes, please use
  Base64 encoding.` — note this is -32600, not -32602.
- `minContextSlot` sets the minimum slot the request may be evaluated at; if
  the node's state at the requested commitment is behind it, the node returns
  `MinContextSlotNotReached` (-32016) with `data.contextSlot`.
- A `pubkey` that is not valid base58 or not 32 bytes is rejected with
  `InvalidParams` (-32602).
- `commitment` defaults to `finalized` when the config object is omitted or
  does not set it.
- `value.space` is the account's full data length, unaffected by `dataSlice`.

## Implementation notes

- **cloudbreak**: rejects `processed` (-32003) or downgrades it; default
  encoding is base58 ("binary") here but base64 for `getMultipleAccounts` —
  a documented inconsistency. `jsonParsed` token accounts whose mint row is
  missing fall back to unparsed encoding.
- **superbank**: method not served.
