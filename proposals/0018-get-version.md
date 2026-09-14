---
number: 0018
title: Specify getVersion
authors: [Triton One]
status: draft
created: 2026-09-07
reference-implementations: [https://github.com/solana-rpc/cloudbreak/blob/2dfa7dc286d014f503ea201402a838577bf7702b/crates/api/src/methods/version.rs]
---

# Specify getVersion

## Summary

Add the standard `getVersion` HTTP method specification.

## Motivation

Clients use this method to identify server software and its feature set.

## Specification

Add the method pair. The method has no parameters and returns a `solana-core` version string plus an optional nullable `feature-set` identifier.

## Return-type impact

Adds a version object.

## Compatibility

Agave conforms. Cloudbreak returns a valid composite `solana-core` string and omits the optional feature set. Superbank does not serve the method. This is additive.

## Reference implementation

Cloudbreak at `2dfa7dc` ships the implementation at https://github.com/solana-rpc/cloudbreak/blob/2dfa7dc286d014f503ea201402a838577bf7702b/crates/api/src/methods/version.rs.

## Security considerations

Version strings expose implementation identity. This is the method's purpose and does not expose secrets.
