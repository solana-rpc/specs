# getSupply

Returns supply figures calculated from the selected bank.

## Semantics

The optional commitment selects the bank. When excludeNonCirculatingAccountsList is true, the response still calculates nonCirculating but returns an empty nonCirculatingAccounts array. Values are lamports.

## Implementation notes

- [**Agave**](../../implementations/agave.md): reference implementation. See the pinned [processor](https://github.com/anza-xyz/agave/blob/6dd9d38771e46103b9680357a855804165612602/rpc/src/rpc.rs#L1126-L1153).
