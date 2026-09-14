# getStakeMinimumDelegation

Returns the minimum number of lamports that the selected bank permits for a stake delegation.

## Semantics

The optional context configuration selects the bank and can require a minimum context slot. The value is a lamport amount, not SOL.

## Implementation notes

- [**Agave**](../../implementations/agave.md): reference implementation. See the pinned [handler](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L4407-L4414).
