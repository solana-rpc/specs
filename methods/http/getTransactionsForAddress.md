# getTransactionsForAddress

Returns a page of transactions involving `address`. Summary pages contain
signatures and status information; `transactionDetails: full` returns encoded
transactions and metadata. This is the proposed contract accompanying RFC 0013,
not a claim that other RPC implementations already expose the method.

## Configuration and defaults

The parameters are an address and an optional configuration object. The defaults
are `transactionDetails: signatures`, `sortOrder: desc`, `commitment: finalized`,
`filters.status: any`, and `filters.tokenAccounts: none`. Full pages default to
`encoding: json`. Omitted filters impose no corresponding restriction.

`limit` is a positive u64. The default and ceiling are 1,000 for summaries and 100
for full pages, further reduced by a node's configured cap. Oversized requests
are clamped; zero is `InvalidParams` (-32602). A short page does not establish
that the address has no more history. Retention, indexing and unavailable full
payloads can limit the response.

The YAML describes canonical spellings and non-null option values. Superbank's
more permissive parsing is recorded below, not silently promoted to a requirement.
Slots are u64, transaction indexes u32, and block times i64 Unix seconds. Clients
must preserve integer precision, including values above JavaScript's 2^53-1.

## Ordering and continuation

Results are ordered by `(slot, transactionIndex, signature)`, descending by
default; `asc` reverses each key. Duplicate signatures are removed within a page.
`transactionIndex` is the zero-based position in the block's transaction list.

`paginationToken` accepts a signature or a decimal `slot:transactionIndex` pair.
A signature resolves to its transaction position; it is not a lexical comparison.
The continuation predicate uses `(slot, transactionIndex)`: strictly lower for
`desc`, strictly greater for `asc`. It excludes that position, including any
records tied at that position. The signature sort key does not extend the cursor.
The usual pagination model assumes one canonical transaction per block position;
this proposal does not guarantee traversal of conflicting records at that position.

Nonempty pages return a token for the last emitted item. Both token forms are
valid; their selection is implementation-dependent and is not tied to detail
mode. Clients SHOULD replay a returned token unchanged with the same address,
filters, ordering, commitment and detail options. A non-null token is a continuation
position, not a `hasMore` guarantee. An empty page returns `data: []` and
`paginationToken: null`.

For example, below `114:2`, a descending scan can return `114:1` before moving to
slot 113. An ascending scan above `114:2` can return `114:3` before slot 115.
A syntactically valid position need not identify an existing transaction. Empty,
malformed or overflowing tokens return `InvalidParams`. The schema checks token
syntax; it cannot establish whether a signature exists or whether digit strings
fit the Rust numeric types.

There is no snapshot identifier, cursor expiry promise or cross-provider cursor
portability guarantee. Changes in commitment, forks, retention and ingestion can
change successive pages. Behavior for a well-formed but unresolvable signature
is an open standardization decision; clients cannot assume a missing-cursor error.
The shipped behavior is documented below.

## Filters

All supplied comparisons and the continuation bound apply together (logical AND).
Valid contradictory numeric bounds select an empty range, not a new range error.

| Filter | Operators / values | Meaning |
| --- | --- | --- |
| `slot` | `gt`, `gte`, `lt`, `lte` | Exclusive/inclusive u64 slot bounds. `eq` is unsupported. |
| `blockTime` | `gt`, `gte`, `lt`, `lte`, `eq` | i64 timestamp comparisons. Entries with unknown time do not satisfy a supplied comparison. |
| `signature` | `gt`, `gte`, `lt`, `lte` | Bounds on resolved slot/index positions, independent of sort direction. `eq` is unsupported. |
| `status` | `any`, `all`, `succeeded`, `failed` | `any` and `all` are equivalent. Success means null execution error. |
| `tokenAccounts` | `none`, `all`, `balanceChanged` | Expand direct-address history with indexed token-owner activity, as described below. |

`beforeSlot` aliases `filters.slot.lt`; `untilSlot` aliases `filters.slot.gt`.
`beforeSlot` cannot coexist with `filters.slot.lt` or `.lte`; `untilSlot` cannot
coexist with `.gt` or `.gte`, even when the values agree. Conflicts and unsupported
`eq` filters return `InvalidParams`. Cross-side combinations are allowed.
`beforeSlot: 0` selects no slots; `untilSlot: 0` excludes slot zero. Use a position
cursor, not a whole-slot alias, to resume inside a slot.

The direct-address set contains transactions whose account keys include the
address, including loaded addresses. `tokenAccounts: all` adds indexed activity
for token accounts attributed to that owner in transaction metadata.
`balanceChanged` adds only activity marked as a balance change; it does NOT
remove otherwise matching direct-address transactions without a token change.
Other filters apply to the combined set. Transactions found in both sets appear
once. This does not promise exhaustive history for every currently owned token
account. Missing required owner-activity data causes a non-`none` request to fail
with `InvalidParams`.

## Results, commitment and errors

The result is an empty page, a nonempty summary page or a nonempty full page.
Each nonempty page has one uniform item shape. Summary items include signature,
slot, transaction index, error, memo, nullable block time and confirmation status.
Full items include slot, transaction index, nullable block time, transaction and
nullable metadata. They include `version` when `maxSupportedTransactionVersion`
is supplied.

Full pages support `json`, `jsonParsed`, `base58` and `base64`. Omitting version
support accepts legacy transactions only; encountering an unsupported version
during hydration fails the request with `UnsupportedTransactionVersion` (-32015).
Encoding and version options affect full results only; recognized fields still
have to parse with the correct types on summary requests.

`minContextSlot` is a freshness prerequisite, not a transaction filter or a
snapshot. If the node's context at the requested commitment is below it, the
request fails with `MinContextSlotNotReached` (-32016) and `data.contextSlot`.
Backend failures are errors, not proof of an empty history.

## Implementation notes

- [**Agave**](https://github.com/solana-rpc/specs/blob/60f4c2fed5b5e23f2b1ed4063f9498489a349a93/implementations/agave.md): no public method exists at the reviewed revision. The nearest
  [pinned primitive](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L1888-L2032)
  is `getSignaturesForAddress`, which does not implement this contract.
- **Cloudbreak**: does not serve this method at the reviewed revision.
- **Superbank v0.6.0-rc1**, pinned to `0a77db6fb01191c771994b71e1d7b6ed8500aeca`:
  - Accepts null optional config/fields as absent, ignores unknown option and
    filter keys, and handles option enum strings case-insensitively. It trims
    outer whitespace on pagination tokens; the canonical schema uses unpadded
    token strings. Invalid recognized types are rejected.
  - A well-formed pagination signature not found in its indexes loses the cursor
    restriction and can restart the scan. An unresolved signature-filter bound
    imposes no restriction on that side. These differ from the missing-cursor
    error used by `getSignaturesForAddress`; see RFC 0013 for the decision needed.
  - `processed` requires the compiled and enabled gRPC head cache. Head-cache
    merging excludes block-time, signature-filter and token-owner queries, so
    enabling it alone does not establish complete processed coverage for all
    filters. Historical storage contributes finalized records.
  - Full-page assembly skips selected entries whose payload cannot be obtained,
    for example after cache eviction or with incomplete stored data. Its token
    follows the last item actually emitted; an empty full page can occur despite
    matching indexed summaries. Do not infer complete history from that result.
  - Owner activity uses post-transaction token owner metadata, falling back to
    pre-transaction owner metadata. Missing pre/post balance entries or a changed
    amount mark balance changes. Ownership-transfer and missing-metadata policy
    remain review questions for portable standard behavior.

Source, test and release links are collected in
[proposal 0013](../../proposals/0013-get-transactions-for-address.md). These notes
are pinned source observations, not current deployment or conformance guarantees.
