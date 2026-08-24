# getTokenAccountsByOwner

Returns the SPL Token accounts owned by `owner`, narrowed either to a single
mint or to a single token program.

## Semantics

- `filter` is **required** and is exactly one of two forms:
  `{ "mint": <Pubkey> }` or `{ "programId": <Pubkey> }`. It is a positional
  parameter of its own, not a field of the config object, and an object
  carrying both keys (or neither) is rejected with `InvalidParams` (-32602).
- With `{ programId }`, the program must be a known token program — SPL Token
  or Token-2022. Agave rejects anything else with -32602
  `Invalid param: unrecognized Token program id`.
- With `{ mint }`, the mint account is read to discover its owning token
  program; if that owner is not a known token program the request fails with
  -32602 `Invalid param: not a Token mint`. The token program is therefore
  derived, never supplied, in this form.
- The result **always** uses the context envelope: `{ context, value }`, where
  `value` is an array — unlike `getProgramAccounts`, there is no `withContext`
  switch and no bare-array shape.
- An owner with no matching token accounts yields an empty `value` array, not
  an error and not `null`.
- Results are always sorted by pubkey; the reference implementation does not
  expose `sortResults` on this method.
- `jsonParsed` is the conventional encoding here — it renders each account
  through the `spl-token` parser (`tokenAmount`, `mint`, `owner`, `state`, …).
  The binary encodings are also accepted and return the corresponding
  `UiAccountData` variant; when `encoding` is omitted the reference
  implementation uses the legacy `binary` (bare base58 string) form.
- `commitment`, `minContextSlot`, and `dataSlice` behave as for
  `getAccountInfo`. `base58`/`binary` encoding fails the whole request with
  `InvalidRequest` (-32600) when a returned account's data exceeds 128 bytes —
  which every 165-byte token account does, so binary encodings require an
  explicit `dataSlice` or `base64`.
- Nodes running the token-owner secondary index that exclude this owner key
  return `KeyExcludedFromSecondaryIndex` (-32010); a failed scan returns
  `ScanError` (-32012).

## Implementation notes

- **cloudbreak**: restricts the `programId` filter to the two known token
  programs (SPL Token and Token-2022) and rejects others with -32602.
  Rejects `processed` commitment (-32003) or downgrades it to `confirmed`.
  Its sibling `getTokenAccountsByDelegate` matches the delegate by byte
  layout and supports legacy SPL Token only.
- **superbank**: method not served (history-only RPC).
