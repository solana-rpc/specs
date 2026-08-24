# getProgramAccounts

Returns every account owned by `programId`, optionally narrowed by filters.
This is the most expensive method in the standard surface: it scans the
program's accounts and is commonly rate-limited, index-gated, or refused
outright by providers.

## Return-type variants

The result shape is a function of the `withContext` config field, and the two
shapes are not interchangeable:

- `withContext` absent or `false` (the default): the result is a **bare
  array** of `RpcKeyedAccount`.
- `withContext: true`: the result is an **object** `{ context, value }`, where
  `value` is that array.

Clients MUST branch on the shape they asked for; a client that always expects
one shape breaks against the other.

Each `account.data` field's wire shape additionally depends on the request
`encoding` — see the `UiAccountData` schema. When `encoding` is omitted the
reference implementation uses the legacy `binary` encoding, whose data is a
bare base58 string rather than a `[data, encoding]` tuple.

## Semantics

- **Filters are ANDed.** An account is returned only if it satisfies every
  entry of `filters`. An empty or absent `filters` list matches all accounts
  owned by the program.
- At most 4 filters are accepted (`MAX_GET_PROGRAM_ACCOUNT_FILTERS`); more is
  `InvalidParams` (-32602), message `Too many filters provided; max 4`.
- Filter kinds: `{ dataSize }`, `{ memcmp: { offset, bytes, encoding? } }`,
  and the bare string `"tokenAccountState"` (matches accounts that
  deserialize as initialized SPL Token accounts).
- `memcmp.bytes` defaults to base58; `encoding: base64` selects base64.
  Comparison data must decode to at most 128 bytes — larger is
  `InvalidParams` (-32602) with `Invalid param: DataTooLarge`.
- **Default sort order is by pubkey, ascending.** `sortResults` defaults to
  `true`; setting it to `false` permits the node to return accounts in
  storage order, which is unspecified and unstable between calls.
- `dataSlice`, `commitment`, and `minContextSlot` behave as for
  `getAccountInfo`. `base58`/`binary` encoding of an account whose returned
  data exceeds 128 bytes fails the whole request with `InvalidRequest`
  (-32600).
- Nodes that run the program-id secondary index and exclude this program
  return `KeyExcludedFromSecondaryIndex` (-32010); a scan that fails or is
  aborted mid-flight returns `ScanError` (-32012).
- The response is not paginated and has no size cap in the protocol: a broad
  query against a large program can return hundreds of megabytes.

## Implementation notes

- **cloudbreak**:
  - accepts but **ignores** `sortResults` — results come back in database
    order regardless of the value passed.
  - restricts gPA against SPL Token / Token-2022 to queries shaped like
    `getTokenAccountsByOwner` / `getTokenAccountsByDelegate` (owner or
    delegate memcmp) or filtered by mint; anything else is rejected with
    -32602.
  - returns -32010 for programs outside its indexer's configured filter set.
  - enforces `minContextSlot` **only** when `withContext: true`; with the
    bare-array shape the parameter is accepted and ignored.
  - streams the response body. A database error that occurs mid-stream
    truncates the JSON already on the wire instead of producing a JSON-RPC
    error object, so clients must treat a parse failure as a possible
    server-side error rather than a malformed spec response.
  - rejects `processed` commitment (-32003) or downgrades it.
- **superbank**: method not served (history-only RPC).
