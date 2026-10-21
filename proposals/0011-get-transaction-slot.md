---
number: 0011
title: Standardize getTransaction slot lookup
authors: [Triton One]
status: draft
created: 2026-09-02
reference-implementations: [https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/handlers/transactions.rs]
---

# Standardize getTransaction slot lookup

## Summary

Add the optional `slot` member to the `getTransaction` configuration object.

## Motivation

A caller can know both a transaction signature and its slot from another RPC response. An exact-slot lookup lets storage-backed implementations avoid a broader signature search and gives callers a deterministic way to reject a same-signature result from another slot.

## Specification

Add optional `config.slot`, an unsigned 64-bit integer (including zero), to `getTransaction`. When present, the server MUST return a transaction only when the supplied signature is present in that exact slot. It MUST return `null` when the signature is not present there. Omission keeps the ordinary lookup. The canonical schema rejects null and non-integer values; Superbank also accepts null as omission. The field does not change the result shape, commitment, encoding, version gating or backend errors. It is an exact constraint, not a best-effort optimization.

## Return-type impact

None. The method continues to return the existing transaction-or-null result.

## Compatibility

Superbank v0.6.0-rc1 implements an exact signature-and-slot lookup. Agave ignores the unknown field and remains partial until it implements this behavior. Cloudbreak does not serve the method. This is additive for clients that omit the new optional field.

## Reference implementation

Superbank v0.6.0-rc1 ships the implementation at https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/handlers/transactions.rs.

## Security considerations

The field narrows a lookup to one slot and has no unbounded input. Implementations must validate it as an unsigned slot number and retain normal request limits.

## Evidence and validation

The reference is the published [v0.6.0-rc1 release](https://github.com/solana-rpc/superbank/releases/tag/v0.6.0-rc1), resolved to `0a77db6fb01191c771994b71e1d7b6ed8500aeca`.

| Evidence | What it establishes |
| --- | --- |
| [Parser](https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/handlers/transactions.rs#L67-L100) | Integer slot extraction, null-as-absent tolerance and config validation. |
| [Handler](https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/handlers/transactions.rs#L352-L450) | Cache mismatch returns null; storage lookup is signature plus slot; storage errors remain errors. |
| [Parser tests](https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/handlers/transactions.rs#L1894-L1938), [head-cache mismatch test](https://github.com/solana-rpc/superbank/blob/0a77db6fb01191c771994b71e1d7b6ed8500aeca/crates/superbank-rpc/src/tests/mod.rs#L5493-L5525) | Existing targeted regression coverage at the release revision; not a live deployment check. |

The paired YAML examples include an exact-slot hit and a mismatch returning null.
`tooling/test/get-transaction-slot.test.ts` checks the actual request/result schemas.
Schema tests do not execute an RPC server or establish matching-signature behavior.
The shared Slot schema does not enforce the u64 upper bound, and JavaScript
validation cannot establish lossless u64 handling; those limits remain prose and
implementation requirements. No current deployment or cross-provider conformance
claim is made.

## Unresolved standardization questions

- Should explicit null mean omission in the standard, as it does in Superbank,
  or remain only an implementation tolerance? The draft retains the canonical
  numeric schema pending review.
- Are silent ignores by implementations without extension support acceptable?
  An Agave response can come from a different slot; clients needing the constraint
  must know the provider supports it. This RFC adds no capability-discovery API.
- Should compatibility ratings separate base-method support from extension
  support? The draft retains the existing matrix structure and explains the gap.

Acceptance requires two maintainers representing different implementations under
GOVERNANCE.md. The existing minor-version bump must be sequenced with other RFCs;
this draft is not an accepted standard until merged.
