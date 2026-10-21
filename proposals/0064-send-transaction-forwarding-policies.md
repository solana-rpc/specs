---
number: 0064
title: Add sendTransaction forwarding policies
authors: [rpcpool]
status: draft
created: 2026-10-21
reference-implementations:
  - https://github.com/rpcpool/yellowstone-jet/blob/5f148f3fa221e9b9d841c288feaefc450a2f2294/apps/jet/src/payload.rs#L24-L43
  - https://github.com/rpcpool/yellowstone-jet/blob/5f148f3fa221e9b9d841c288feaefc450a2f2294/apps/jet/src/transactions.rs#L270-L318
---

# Add sendTransaction forwarding policies

## Summary

Add the optional `forwardingPolicies` config field to `sendTransaction`. The field carries an ordered list of Yellowstone Shield policy account addresses that restrict eligible transaction-forwarding validators.

## Motivation

Transaction senders can reduce exposure to validators that do not meet a client's forwarding policy. Yellowstone Shield provides on-chain allow and deny policies, and Jet already accepts those policy addresses in `sendTransaction`. Standardizing the field gives clients one portable wire format and makes policy-aware forwarding visible instead of relying on a vendor-only parameter.

## Specification

Add `forwardingPolicies` to the optional `sendTransaction` config object as an array of Solana pubkeys. Each pubkey identifies a Yellowstone Shield policy account. The array order is significant.

For each scheduled leader identity, the sender evaluates policies in array order. The first policy that contains the identity decides the result: an allow policy makes the identity eligible and a deny policy makes it ineligible. If no policy contains the identity, the identity is ineligible when at least one policy uses the allow strategy and eligible when all policies use the deny strategy. An absent or empty array applies no policy restriction.

The field changes destination selection only. It does not change transaction execution, the signature result, or the existing acknowledgement semantics. A successful response does not assert that the policy set permits a destination or that forwarding occurred.

## Return-type impact

None. The result remains the first transaction signature.

## Compatibility

This is additive for clients. Yellowstone Jet ships the field and scheduled-leader policy evaluation. Jet is more permissive than this schema because it silently removes invalid pubkey strings, and its operator-configured `extra_fanout` destinations bypass policy evaluation. Agave does not implement the field and ignores it as an unknown config member. Cloudbreak and Superbank do not serve `sendTransaction`.

After standardization, an implementation that ignores `forwardingPolicies` cannot claim full `sendTransaction` compatibility. Clients must not assume policy enforcement unless the endpoint advertises support.

## Reference implementation

Yellowstone Jet at `5f148f3` ships the [request field and parser](https://github.com/rpcpool/yellowstone-jet/blob/5f148f3fa221e9b9d841c288feaefc450a2f2294/apps/jet/src/payload.rs#L24-L43) and applies the policies during [scheduled leader forwarding](https://github.com/rpcpool/yellowstone-jet/blob/5f148f3fa221e9b9d841c288feaefc450a2f2294/apps/jet/src/transactions.rs#L270-L318).

## Security considerations

A client can mistake request acceptance for policy enforcement. Implementations must not advertise support while ignoring the field. They must apply the policies to every forwarding destination covered by the standard and fail closed when policy data is unavailable. Implementations should bound the number of policy addresses and the work required to load and evaluate them. The response remains an acknowledgement of queue admission, so clients need separate delivery and confirmation monitoring.
