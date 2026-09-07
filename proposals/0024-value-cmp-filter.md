---
number: 0024
title: Standardize numeric account-data filters
authors: [Triton One]
status: draft
created: 2026-09-07
reference-implementations: [https://github.com/solana-rpc/cloudbreak/blob/2dfa7dc286d014f503ea201402a838577bf7702b/crates/core/src/modules/rpc_filter_type.rs#L81-L245]
---

# Standardize numeric account-data filters

## Summary

Add Cloudbreak's shipped `valueCmp` filter to `getProgramAccounts`.

## Motivation

`memcmp` can test equality but cannot compare numeric fields. Clients that query account layouts with counters, timestamps, amounts, or sequence numbers must fetch and filter all candidates. `valueCmp` lets the server apply an unsigned little-endian numeric comparison before returning account data.

## Specification

Add `ValueCmpFilter` and include it in `GpaFilter`. A filter compares a memory operand with another memory operand of the same unsigned width or with a base-10 constant. Supported widths are 8, 16, 32, 64, and 128 bits. Comparators are equality, inequality, greater-than, greater-than-or-equal, less-than, and less-than-or-equal. Out-of-bounds, mismatched, or invalid operands do not match.

## Return-type impact

None. The filter only narrows the existing account array.

## Compatibility

Cloudbreak ships the filter. Agave and Superbank do not support it and must add it to claim full `getProgramAccounts` support after standardization. Existing requests are unaffected.

## Reference implementation

Cloudbreak at `2dfa7dc` ships the wire type and comparison logic at https://github.com/solana-rpc/cloudbreak/blob/2dfa7dc286d014f503ea201402a838577bf7702b/crates/core/src/modules/rpc_filter_type.rs#L81-L245.

## Security considerations

Numeric filters add bounded per-account decoding and comparison work. Implementations must retain filter-count, scan, response, and execution-time limits. A 128-bit comparison must not allocate based on request data.
