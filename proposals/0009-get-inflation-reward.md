---
number: 0009
title: Add getInflationReward method specification
authors: [rpcpool]
status: draft
created: 2026-09-02
reference-implementations:
  - https://github.com/anza-xyz/agave/blob/v3.1.8/rpc/src/rpc.rs
  - https://github.com/solana-rpc/superbank/tree/0a77db6fb01191c771994b71e1d7b6ed8500aeca
---

# Add `getInflationReward` method specification

## Summary

Add the HTTP `getInflationReward` method with its Agave request, reward result, availability errors, and implementation support matrix. Record Superbank's shipped ClickHouse behavior and its availability and epoch-schedule limits.

## Motivation

Superbank implements this standard Agave method, but the repository does not currently describe it. A method-level contract lets clients distinguish a missing reward from an unavailable payout boundary or an active partitioned reward period.

## Specification

Add `methods/http/getInflationReward.yaml` and `methods/http/getInflationReward.md`. The method accepts an address array and an optional epoch configuration object. It returns one reward object or `null` per address, preserving input order. The specification documents Agave's boundary and partition availability errors and records Superbank as partial because it rejects processed commitment, enforces stricter config and address limits, and depends on a matching cluster epoch schedule.

## Return-type impact

Add the `InflationReward` result object with required `epoch`, `effectiveSlot`, `amount`, `postBalance`, and nullable `commission` fields. Add optional `commissionBps` for current Agave/Superbank data. The array item may also be `null` when no reward exists for the corresponding address.

## Compatibility

This is an additive specification change. Agave conforms to the baseline. Superbank implements the method with the documented partial behavior. Cloudbreak does not serve it.

## Reference implementation

- [Agave `get_inflation_reward` at v3.1.8](https://github.com/anza-xyz/agave/blob/v3.1.8/rpc/src/rpc.rs#L696-L889)
- [Superbank shipped reference `0a77db6`](https://github.com/solana-rpc/superbank/tree/0a77db6fb01191c771994b71e1d7b6ed8500aeca)

## Security considerations

Implementations should bound the number of addresses and the work needed to read historical reward partitions. Superbank applies address, concurrency, query-time, memory, and read-byte limits. No additional security impact is introduced by documenting the method.
