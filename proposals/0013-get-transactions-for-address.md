---
number: 0013
title: Standardize getTransactionsForAddress
authors: [linuskendall]
status: draft
created: 2026-09-02
reference-implementations:
  - https://github.com/solana-rpc/superbank/blob/v0.6.0-rc1/crates/superbank-rpc/src/handlers/transactions.rs#L472-L1863
  - https://github.com/solana-rpc/superbank/blob/v0.6.0-rc1/crates/superbank-rpc/src/handlers/types.rs#L105-L205
  - https://github.com/solana-rpc/superbank/blob/v0.6.0-rc1/crates/superbank-rpc/src/tests/mod.rs#L985-L1084
---

# Standardize getTransactionsForAddress

## Summary

Standardize `getTransactionsForAddress`, a paginated transaction-history method with summary and full-detail result modes, filtering, ordering, and opaque cursors.

## Motivation

The standard API can return signatures for an address and can fetch one transaction by signature, but it cannot return a filtered page of full transactions for an address. Indexers, explorers, wallets, and compliance systems otherwise need to combine several calls and maintain their own transaction archive. Superbank ships this method today, so the proposal defines an existing interoperable wire surface rather than a speculative API.

## Specification

Add `methods/http/getTransactionsForAddress.yaml` and its normative Markdown companion. The method takes an address and one optional configuration object. The configuration selects summary or full records, ascending or descending stable order, page size, an exclusive cursor, commitment, transaction encoding and version support, and filters for slot, block time, transaction position, execution status, and token-account activity. The result wraps `data` and a nullable `paginationToken`.

`beforeSlot` and `untilSlot` are standardized as exclusive aliases for upper and lower slot bounds. The proposal forbids their conflicting same-side filter combinations. Summary pages permit up to 1,000 records by default and full pages up to 100; an implementation may apply a lower configured limit. `tokenAccounts` is optional capability data: a node that does not retain the required owner-activity index must reject a non-`none` request with `InvalidParams`.

## Return-type impact

The new method returns one of two page shapes. Summary items include signature, slot, transaction index, execution result, memo, block time, and confirmation status. Full items include slot, transaction index, block time, encoded transaction, nullable metadata, and optional version. The existing shared transaction schemas cover all item fields, so no new shared schema is added.

## Compatibility

This is additive for clients. Superbank v0.6.0-rc1 implements the proposed surface and is recorded as partial support because `processed` requires its optional head cache. Agave and Cloudbreak do not serve the method. Existing Superbank clients retain the same cursor forms and slot-alias behavior. Implementations that expose only a validator blockstore may need a secondary address and token-owner index to provide full-history pagination.

## Reference implementation

The pinned Superbank v0.6.0-rc1 handler, request and response types, and tests are linked in the front matter. The handler provides the required shipped implementation for this proposal.

## Security considerations

Address-history scans and full transaction hydration can be expensive. The method requires a positive page limit, gives implementations a lower configured cap, and uses opaque cursors rather than unbounded offsets. Implementations must rate-limit requests, bound database work, and avoid treating a caller-supplied cursor as a trusted storage query fragment.
