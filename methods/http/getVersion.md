# getVersion

Returns the RPC node's software version and optional feature-set identifier.

## Parameters

This method has no parameters.

## Result

The result is an object with a required `solana-core` string. The optional `feature-set` field is the unsigned identifier derived from the first four bytes of the active feature set. Older or alternative implementations may omit it or return null.

Clients must treat `solana-core` as implementation-provided text. They must not require a plain semantic version.

## Implementation notes

- [**Cloudbreak**](../../implementations/cloudbreak.md) returns `<upstream-solana-core>-cloudbreak<cloudbreak-version>` and omits `feature-set`. The composite string remains valid standard output.
