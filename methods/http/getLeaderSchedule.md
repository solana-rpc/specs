# getLeaderSchedule

Returns the leader schedule for an epoch.

## Semantics

When `slot` is absent, the server uses the selected bank's current slot. Keys are validator identity public keys. Values are slot indexes relative to the first slot of the epoch. `identity` filters the map. The result is null when the requested epoch's schedule is unavailable.

## Implementation notes

- [**Agave**](../../implementations/agave.md): reference implementation. See the pinned [request handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L3022-L3061) and [processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L3022-L3061).
