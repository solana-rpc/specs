# getMultipleAccounts

Returns account information for a list of addresses in a single request. It
is the batched form of `getAccountInfo`: same config object, same per-account
return shape, one shared RpcResponse context.

## Semantics

- The order of entries in `value` matches the order of the request's
  `pubkeys` array, one-to-one.
- Accounts that do not exist are `null` entries at their request index; they
  are **not** omitted, so `value.length` always equals `pubkeys.length`.
  Duplicate addresses are returned once per occurrence.
- Agave caps the input at 100 pubkeys (`MAX_MULTIPLE_ACCOUNTS`) and rejects
  longer lists with `InvalidParams` (-32602), message
  `Too many inputs provided; max 100`. The cap is configurable on the node
  via `--rpc-max-multiple-accounts`.
- The default `encoding` is `base64` — unlike `getAccountInfo`, whose default
  is the legacy `binary` (bare base58 string) form.
- `dataSlice`, `commitment`, and `minContextSlot` behave exactly as they do
  for `getAccountInfo`, and apply uniformly to every address in the request.
- `base58` encoding errors with `InvalidRequest` (-32600) when any returned
  account's data (after any `dataSlice`) exceeds 128 bytes; the whole request
  fails, not just that entry.
- All accounts are read from a single bank, so every entry shares the one
  `context.slot`.

## Return-type variants

Each non-null entry is a `UiAccount`, whose `data` shape depends on the
request `encoding` — see the `UiAccountData` schema. With `jsonParsed`, any
account whose owner program has no parser falls back to the base64 tuple
form independently of the other entries.

## Implementation notes

- **cloudbreak**: the input cap is configurable via `max-multiple-accounts`
  (default 100); default encoding is `base64`. `processed` commitment is
  rejected (-32003) or downgraded.
- **superbank**: method not served.
