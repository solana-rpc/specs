# getGenesisHash

Returns the base58-encoded hash of the cluster's genesis block.

## Parameters

This method has no parameters.

## Result

The result is the cluster genesis hash. Clients can compare it with an expected hash before submitting cluster-specific work.

## Implementation notes

- [**Cloudbreak**](../../implementations/cloudbreak.md) returns the genesis hash from its cluster configuration. This is compatible because the value is constant for a cluster.
