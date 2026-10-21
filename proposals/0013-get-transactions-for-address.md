---
number: 0013
title: Standardize getTransactionsForAddress
authors: [linuskendall]
status: draft
created: 2026-09-02
reference-implementations:
  - https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/handlers/transactions.rs#L472-L1863
  - https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/handlers/types.rs#L105-L205
  - https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/tests/mod.rs#L985-L1084
---

# Standardize getTransactionsForAddress

## Summary

Standardize `getTransactionsForAddress`, a paginated transaction-history method with summary and full-detail result modes, filtering, ordering, and position cursors.

## Motivation

The standard API can return signatures for an address and can fetch one transaction by signature, but it cannot return a filtered page of full transactions for an address. Indexers, explorers, wallets, and compliance systems otherwise need to combine several calls and maintain their own transaction archive. Superbank ships this method today, so the proposal defines a shipped wire surface as the reference for standardization; cross-provider interoperability has not been established.

## Specification

Add `methods/http/getTransactionsForAddress.yaml` and its normative Markdown companion. The method takes an address and one optional configuration object. The configuration selects summary or full records, ascending or descending stable order, page size, an exclusive cursor, commitment, transaction encoding and version support, and filters for slot, block time, transaction position, execution status, and token-account activity. The result wraps `data` and a nullable `paginationToken`.

`beforeSlot` and `untilSlot` are standardized as exclusive aliases for upper and lower slot bounds. The proposal forbids their conflicting same-side filter combinations. Summary pages permit up to 1,000 records by default and full pages up to 100; an implementation may apply a lower configured limit. `tokenAccounts` is optional capability data: a node that does not retain the required owner-activity index must reject a non-`none` request with `InvalidParams`.

The paired method prose defines defaults, invalid inputs and the exact continuation
predicate: `(slot, transactionIndex)` below the cursor for descending order and
above it for ascending order. The signature tie-breaker in result ordering is not
part of the cursor. A nonempty result has a token for its last emitted item; a token
does not guarantee a further page. The empty result is `{data: [], paginationToken:
null}`. No snapshot or cross-provider token guarantee is added.

All supplied filter predicates intersect. Slot and signature equality are rejected,
while block-time equality is supported. `tokenAccounts` expands the direct-address
set: `balanceChanged` constrains the added owner activity, not direct transactions.
The YAML enforces slot-alias conflicts and unsupported equality operators.
Missing-cursor, coverage and completeness decisions below remain unresolved;
the implementation notes describe shipped behavior without declaring it universal.

## Return-type impact

The new method has two item shapes and a common empty-page result. Summary items include signature, slot, transaction index, execution result, memo, block time, and confirmation status. Full items include slot, transaction index, block time, encoded transaction, nullable metadata, and optional version. Reuse the existing transaction schemas for item fields. Add `schemas/TransactionsForAddressCursor.yaml` for the cursor used by requests and both nonempty result modes. Use three titled, disjoint `oneOf` variants: empty, nonempty summaries, and nonempty full records; empty arrays must not match both detail variants.

## Compatibility

This is additive for clients. Superbank v0.6.0-rc1 implements the method and is recorded as partial: optional head-cache enablement alone does not provide complete processed results for all filters, and unresolved bounds and missing payloads need explicit policy decisions. Agave and Cloudbreak do not serve the method. The draft retains the shipped cursor forms and slot-alias behavior. Its canonical schemas do not require Superbank's null, case and whitespace tolerances. Implementations that expose only a validator blockstore may need a secondary address and token-owner index to provide full-history pagination.

## Reference implementation

The pinned Superbank v0.6.0-rc1 handler, request and response types, and tests are linked in the front matter. The published [v0.6.0-rc1 release](https://github.com/solana-rpc/superbank/releases/tag/v0.6.0-rc1) resolves to this commit. That establishes released source, not the version/configuration of a live endpoint.

## Security considerations

Address-history scans and full transaction hydration can be expensive. The method requires a positive page limit, gives implementations a lower configured cap, and uses bounded position cursors rather than offsets. Tokens are not authenticated query snapshots; the signature form requires an index lookup. Implementations must rate-limit requests, bound database work, and avoid treating a caller-supplied cursor as a trusted storage query fragment.

## Evidence and validation

| Evidence | What it establishes |
| --- | --- |
| [Request parser](https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/handlers/transactions.rs#L472-L960), [types](https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/handlers/types.rs#L89-L157) | Defaults, caps, recognized invalid inputs, aliases, optional nulls, enum case handling and cursor resolution. |
| [Query predicates](https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/clickhouse/queries.rs#L328-L573) | Position comparisons, unknown-signature no-op bounds, inclusive/exclusive operators. |
| [Address/owner union](https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/clickhouse/queries.rs#L655-L810), [deduplication](https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/clickhouse/transactions.rs#L185-L254) | Token expansion, conjunction, ordering and per-page duplicate removal. |
| [Owner-activity DDL](https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/ddl/local/token_owner_activity.sql#L76-L108) | Historical ownership attribution and balance-change calculation from metadata. |
| [Head merge](https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/handlers/transactions.rs#L1450-L1548), [full assembly](https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/handlers/transactions.rs#L1700-L1863) | Filter-dependent head coverage; unavailable payloads can be skipped; token follows emitted records. |
| [Invalid-input tests](https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/tests/mod.rs#L4997-L5223), [head-page test](https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/tests/mod.rs#L5985-L6080), [version test](https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/tests/mod.rs#L6083-L6200) | Existing focused regression coverage, not exhaustive pagination or live deployment proof. |

The paired YAML contains summary, full, continuation and empty examples. The full
example reuses the seed getTransaction serialized fixture, with illustrative
slot/index positions. `tooling/test/transactions-for-address.test.ts` validates
actual schemas, conflict rejection, cursor syntax and disjoint page shapes. These
checks cannot prove runtime ordering, cursor existence, metadata completeness or
u64/i64 parsing. Shared numeric schemas omit some width limits; the cursor regex
also checks syntax rather than numeric overflow.

Review against the source includes these cases:

| Case | Shipped behavior / limit |
| --- | --- |
| Descending/ascending from `114:2` | Positions below/above that pair; signature tie-breaker is not included. |
| Unknown pagination signature | Cursor bound disappears; the query can restart. |
| Unknown signature-filter boundary | That predicate imposes no bound. |
| Contradictory numeric bounds | No matching range; not a new InvalidParams case. |
| Null block time with a time comparison | SQL comparisons do not match; filtered head merge is excluded. |
| Direct transaction without token change plus `balanceChanged` | Still eligible; only the additional owner-activity branch is constrained. |
| Missing full payload | Selected entry can be skipped; returned token tracks emitted data. |

No live extension-conformance result is claimed. The parent ticket's historical
14-method compatibility report does not exercise this new method. The separate
compatibility-runner PR is not a dependency of this RFC.

## Unresolved standardization questions

- **Unknown signatures:** retain no-op bounds, return an empty page, or require an
  error? The current permissive behavior can unexpectedly widen a scan. This RFC
  documents it, but does not invent an error code or claim other providers agree.
- **Completeness and continuity:** what should a node do when a selected full
  payload is missing, an index lags, a cursor is pruned, or a fork changes a block
  position? Should processed queries reject unsupported filter combinations?
  No snapshot, exhaustive processed coverage, or gap-free scan is promised here.
- **Owner activity:** should post-owner-first attribution, missing balances and
  token-account creation/closure be standardized as shipped, or should another
  ownership/balance policy be required? The implementation uses transaction
  metadata, not a query of every currently owned account.
- **Input tolerances:** should null-as-absent, ignored unknown members, enum case
  tolerance and padded cursor strings be canonical? Keep the existing canonical
  forms and record shipped tolerances until maintainers decide.
- **Support classification:** is an optional head/owner index a capability limit
  or partial conformance? Keep the current partial rating with concrete notes,
  without extending the repository's support-matrix schema in this RFC.

Acceptance requires two maintainers representing different implementations under
GOVERNANCE.md. Resolve these questions before acceptance; any chosen behavior
without shipped support must be labelled a proposed divergence. Sequence the
existing minor-version bump with other substantive PRs before merge.
