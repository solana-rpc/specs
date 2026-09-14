# Solana RPC Specs

Implementation-independent specification of the Solana JSON-RPC API.

The baseline is the Agave RPC implementation; the spec additionally records
how other implementations (cloudbreak, superbank) support or deviate from
standard behavior, MDN-compatibility-table style. Vendor-specific extensions
are NOT specced here — they enter the standard via the RFC process
(see [GOVERNANCE.md](GOVERNANCE.md)).

### Implementation notes

Deviations are recorded per method, but one is cross-cutting and worth knowing
up front: **cloudbreak does not reproduce Agave's error payloads.** Its
JSON-RPC `message` field carries an opaque SNAKE_CASE token (e.g.
`PROCESSED_COMMITMENT_NOT_SUPPORTED`) rather than Agave's interpolated message,
and its error `data` is always `null` — even for codes where this spec
documents a `data` schema. Clients that parse Agave's message text or read
`data` fields must special-case cloudbreak.

## Layout

| Path | Contents |
|---|---|
| `methods/http/`, `methods/websocket/` | One `<method>.yaml` (machine-readable schema) + `<method>.md` (normative prose) per method |
| `schemas/` | Shared JSON Schema components, one per file |
| `errors/codes.yaml` | Canonical error-code registry |
| `compatibility.yaml` | Live-test fixture schemas, defaults, and discovery steps |
| `proposals/` | RFC proposal documents |
| `tooling/` | TypeScript validator + bundler |
| `dist/openrpc.json` | CI-built canonical [OpenRPC](https://open-rpc.org) document — never hand-edited |

## Consuming the spec

The compiled OpenRPC document (all types as JSON Schema) is published on
GitHub Pages by CI on every merge to `main`. Machine consumers (validators,
routers, codegen) should use it; humans should read `methods/`.

### Extensions

`dist/openrpc.json` is a valid OpenRPC 1.2.6 document. Solana-specific metadata uses `x-` extension fields, which a strict OpenRPC consumer may ignore without losing structural validity.

| Extension | Location | Contents |
|---|---|---|
| `x-solana-status` | each method | `standard` or `deprecated`. A deprecated method also sets the standard `deprecated: true` flag. |
| `x-solana-implementations` | each method | Support matrix keyed by implementation (`agave`, `cloudbreak`, `superbank`), each with a `status` (`full`, `partial`, `none`) and optional `notes`. |
| `x-notification` | `*Subscribe` methods | The `{name, schema}` of the notification the subscription pushes — OpenRPC has no native notion of a server-initiated message, so the subscribe method's own `result` is only the subscription id. |
| `x-solana-errors` | document root | Map keyed by error **name** carrying `dataSchema`, `emittedBy`, and `description` for that error. |
| `x-tests` | each method | Executable tests from the method YAML's `tests` list. |
| `x-category` | each method | Method category. |
| `x-test-setup` | each method, when declared | Optional prerequisite calls. |
| `x-test-config` | document root | Shared fixture definitions and discovery steps from `compatibility.yaml`. |

`x-solana-errors` is a root-level map rather than fields on the errors
themselves because OpenRPC's `errorObject` is `additionalProperties: false` and
permits no `x-` extensions — so `components/errors/<Name>` is strictly
`{code, message}`. A consumer that resolves a method's
`$ref: '#/components/errors/<Name>'` must look up the same `<Name>` in
`x-solana-errors` to get the error's `data` schema and prose.

## Working locally

To test a live RPC endpoint against this checkout, run `cd tooling && npm ci && npm run compat -- --help`. The runner executes explicit `tests` lists from method YAML; methods without tests are skipped. It selects the full spec, categories such as Accounts or Ledger, or individual methods. It produces text, JSON, and standalone HTML compatibility reports. See [Live RPC compatibility checks](tooling/compatibility.md) for test declarations, fixtures, coverage, and exit codes.

```bash
cd tooling
npm install
npm run validate   # check every rule CI checks
npm run build      # write dist/openrpc.json
npm test           # tooling unit tests
```

## Status

Seeded with a representative subset of methods. Remaining Agave HTTP methods
and WebSocket subscriptions are being backfilled.

## License

[MIT](LICENSE). The compiled `openrpc.json` carries the same license in its
`info.license` field.
