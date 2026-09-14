# getGenesisHash

Returns the base58-encoded hash of the cluster's genesis block.

## Parameters

This method has no parameters.

## Result

The result is the cluster genesis hash. Clients can compare it with an expected hash before submitting cluster-specific work.

## Implementation notes

- [**Agave**](../../implementations/agave.md): reference implementation. See the pinned [request handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L2919-L2922).
- [**Cloudbreak**](../../implementations/cloudbreak.md) returns the genesis hash from its cluster configuration. This is compatible because the value is constant for a cluster.
