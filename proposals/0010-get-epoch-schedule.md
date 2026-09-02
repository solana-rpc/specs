---
number: 0010
title: Add getEpochSchedule method specification
authors: [rpcpool]
status: draft
created: 2026-09-02
reference-implementations:
  - https://github.com/anza-xyz/agave/blob/master/rpc/src/rpc.rs
  - https://github.com/solana-rpc/superbank/tree/0a77db6fb01191c771994b71e1d7b6ed8500aeca
---

# Add `getEpochSchedule` method specification

## Summary

Add the HTTP `getEpochSchedule` method with the five Agave epoch schedule fields and an implementation support matrix. Record Superbank's fixed no-warmup response and its compatibility boundary.

## Motivation

Epoch-aware clients need the cluster's schedule to map slots to epochs and to calculate leader schedule boundaries. Superbank wires this method, but the specs repository does not currently define it.

## Specification

Add `methods/http/getEpochSchedule.yaml` and `methods/http/getEpochSchedule.md`. The method takes no parameters and returns `slotsPerEpoch`, `leaderScheduleSlotOffset`, `warmup`, `firstNormalEpoch`, and `firstNormalSlot`. Agave obtains these values from genesis-backed bank state. The method records Superbank as partial because its shipped handler always returns the modern 432000-slot, no-warmup schedule.

## Return-type impact

Add a new object result with five required fields. The four schedule counts are unsigned 64-bit integers. `warmup` is a required boolean.

## Compatibility

This is an additive specification change. Agave conforms to the baseline. Superbank conforms when its fixed schedule matches the cluster and is partial for other schedules. Cloudbreak does not serve the method.

## Reference implementation

- [Agave `get_epoch_schedule`](https://github.com/anza-xyz/agave/blob/master/rpc/src/rpc.rs#L924-L929)
- [Superbank shipped reference `0a77db6`](https://github.com/solana-rpc/superbank/tree/0a77db6fb01191c771994b71e1d7b6ed8500aeca)

## Security considerations

None identified. The method returns public cluster metadata and performs no client-controlled historical scan.
