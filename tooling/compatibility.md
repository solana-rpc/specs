# Live RPC compatibility checks

The runner reads method files and executes their explicit `tests` lists. It checks responses against the method schemas and declared assertions. Method names, categories, fixtures, discovery calls, and behavior expectations come from YAML, not method-specific TypeScript adapters. Documentation examples do not execute. Implementation support notes do not change expectations. It does not compare endpoints or require their slots, balances, or transaction history to match.

Use Node.js 20 or later. From `tooling/`:

```bash
npm ci
npm run compat -- --help
npm run compat -- --list
```

## Select a scope

Set the endpoint in the environment to keep it out of command output. These examples use a local validator:

```bash
export RPC_ENDPOINT=http://127.0.0.1:8899
export RPC_WS_ENDPOINT=ws://127.0.0.1:8900

# Select every method in the checked-out spec.
npm run compat -- --label local-validator

# Select categories or exact method names.
npm run compat -- --category Accounts
npm run compat -- --category Ledger,Tokens
npm run compat -- --method getAccountInfo,getProgramAccounts
npm run compat -- --method getBlock --method getTransaction

# List a selection without making network calls.
npm run compat -- --category Ledger --list
```

Category names are case-insensitive. Method names match wire names exactly. Repeated values and comma-separated values both work. Categories and methods intersect when used together. Unknown selectors and empty selections fail before network access.

| Category | Scope |
| --- | --- |
| Accounts | Account data, balances, multiple accounts, program accounts |
| Tokens | Token account and mint queries |
| Ledger | Blocks, slots, blockhashes, transaction history, transaction counts and signature status queries |
| Transactions | `sendTransaction` and `simulateTransaction` only |
| Cluster | Health, identity, version, epoch and cluster queries |
| Subscriptions | WebSocket methods |
| Other | Methods without a category assignment |

Categories come from each method's `category` field; the table describes the repository's category convention. New categories need no runner changes. Only explicit `tests` execute. Omitted or empty test lists appear as **skipped**, even when the method has documentation examples. Leave tests off `sendTransaction` and other methods that should not execute against live endpoints. Review test and discovery requests before running them; there is no read-only flag or method-name allowlist. Selecting the full spec does not claim every normative statement is tested.

WebSocket tests require an explicit `--ws-endpoint` or `RPC_WS_ENDPOINT`. HTTP and WebSocket services may use different addresses or ports. The runner never guesses a WebSocket port. Without one, selected WebSocket methods appear as skipped. When testing only `accountUnsubscribe`, the runner creates a prerequisite subscription on the same connection.

## Reports and exit codes

```bash
npm run compat -- --category Ledger --label local-validator --format json --output /tmp/rpc-report.json
npm run compat -- --category Accounts --label local-validator --format html --output /tmp/rpc-report.html
```

Text is the default. JSON includes each probe, its category, source document, status, error code when relevant, and duration. It also includes the spec version, a SHA-256 fingerprint of the loaded methods, prose, schemas, errors and compatibility configuration, and coverage totals. HTML is a standalone report with a status filter and no external assets.

Use `--output` to write a report directly. For machine-readable stdout, use `npm run --silent compat -- --format json` to suppress npm's command banner.

| Status | Meaning |
| --- | --- |
| pass | The response matches the schema and the assertions for this probe. |
| fail | The response violates the JSON-RPC envelope, schema, expected error, or tested behavior. |
| unsupported | The endpoint returns `MethodNotFound` (-32601). |
| inconclusive | A declared availability error or missing live data prevents the behavior check. |
| error | A timeout, connection failure, HTTP error, size limit, server internal error, or runner error prevents evaluation. |
| skipped | A fixture, WebSocket endpoint, or explicit test declaration is missing. |

Exit code `0` means every selected probe passed. Code `1` means at least one probe failed or a method was unsupported. Code `2` means the run is incomplete without a demonstrated incompatibility, or local configuration is invalid. A report is still written for partial runs. Pass counts measure executed probes, not full conformance. A method can have both passes and failures.

Reports exclude endpoint URLs, headers, fixture values, raw responses, and server error messages. Choose a non-sensitive `--label`; labels appear verbatim in text and JSON, and are escaped in HTML. Keep private fixture files and reports outside the repository. New report files use owner-only permissions. Existing file permissions are preserved.

## Fixtures and bounded discovery

The root `compatibility.yaml` declares fixture schemas, defaults, random base58 generation, and discovery steps. The default account is the Clock sysvar. Random 32-byte addresses and 64-byte signatures exercise absent-account and absent-transaction behavior without submitting transactions. The declared discovery group finds a recent finalized slot through `getSlot`, a small slot window through `getBlocks`, and one block through `getBlock`. Discovery can call explicitly declared read methods even when they are not selected or not yet in the spec. It gathers a signature, an address with history, and token-owner information from that endpoint's block. Discovery responses are setup inputs, not conformance passes.

Use `--no-discover` to prevent automatic discovery reads. Method-level setup still runs when declared. Provide `--fixtures /path/to/fixtures.json` for retained history, indexed accounts, or an endpoint that cannot serve ledger discovery. Accepted fields and their schemas come from `compatibility.yaml`. Common overrides:

| Field | Purpose |
| --- | --- |
| `account` | Existing account for encoding probes; keep its data at most 128 bytes for base58 tests. Defaults to the Clock sysvar. |
| `slot` | Recent readable finalized block with transactions. |
| `signature` | Transaction visible at finalized commitment. |
| `address` | Address with recent transaction history. |
| `tokenOwner` | Owner with at least one indexed token account. |
| `tokenMint` | Mint held by that owner; required for the populated mint-filter probe. |
| `tokenProgram` | Token program for the owner-filter probe. Defaults to SPL Token. |
| `missingAccount` | Known absent address; otherwise generated randomly. |
| `missingSignature` | Known absent signature; otherwise generated randomly. |

For example, an account-only fixture file can contain:

```json
{
  "account": "SysvarC1ock11111111111111111111111111111111"
}
```

Fixture overrides take precedence over discovery. A null transaction or empty populated-token query is inconclusive, even when it matches the broad result schema. A random absent token owner may hit an index exclusion policy; that is also inconclusive. Supply fixtures appropriate to each endpoint's chain and retention. Fixtures do not define expected responses from another implementation.

All calls run sequentially. Defaults are a 100 ms delay before each HTTP call, a 10 second per-call deadline, and a 16 MiB response cap. Configure these with `--delay`, `--timeout`, and `--max-bytes`. HTTP redirects are refused. There are no automatic retries. Requests are bounded on the client; cancelling a request does not guarantee the server stops its work.

The declared program-account probes use the small sysvar program with a 40-byte data-size filter and a zero-length data slice. Block probes request one block at a time, but full transaction variants can still be large. Choose limits for the target's capacity. New declarations must also use bounded requests; the runner cannot infer server-side query cost from a schema.

WebSocket probes subscribe to the Clock sysvar, check deduplication, observe notifications for `--notification-wait` milliseconds (default 3000), and test unsubscribe behavior. They check the notification schema, subscription id, base64 encoding, and the spec's requirement to ignore `dataSlice`. No notification during the observation window is inconclusive. Closing the socket releases all subscriptions.

For authentication, put a JSON object of string headers in an environment variable and name it with `--headers-env`. The same headers apply to HTTP and WebSocket connections:

```bash
npm run compat -- --headers-env RPC_TEST_HEADERS --category Accounts
```

## Declare tests in the spec

Add a `tests` list directly to the method YAML. Keep `category` as a separate method field. A test needs a name and positional parameters; `expect` is optional:

```yaml
category: Accounts
tests:
  - name: invalid-pubkey
    params: ['bad!']
    expect:
      error: InvalidParams
```

Every successful response is checked against the method's existing `result.schema`. Use `expect` only for additional behavior or an expected error. Error names resolve through `errors/codes.yaml`; a test may also declare an exact `message`. Negative tests intentionally bypass positive request-schema validation.

Tests can use shared live fixtures and extra result assertions:

```yaml
category: Accounts
tests:
  - name: missing-account
    params: [{ $fixture: missingAccount }]
    expect:
      result:
        properties:
          value: { type: 'null' }
```

No TypeScript adapter or safety flag is needed. Omit `tests` or set `tests: []` to skip the method. The runner does not run that method's setup or discover fixtures for it. Categories and documentation examples never authorize requests.

For a schema-only smoke test, declare a name and parameters without `expect`. Parameters are positional and follow the order in the method's `params` list. Documentation examples remain available for offline spec validation; their requests and historical result values do not become live tests.

### Optional behavior assertions

The optional `expect` fields run in this order:

| Field | Check |
| --- | --- |
| `shape` | Additional JSON Schema checked before data availability; a mismatch fails. |
| `available` | JSON Schema describing required live data; a mismatch is inconclusive. |
| `result` | Additional JSON Schema for request-dependent assertions; a mismatch fails. |
| `assertions` | Cross-value equality, array ordering, or decoded base64 length checks; a mismatch fails. |

Schemas can reference shared `#/components/schemas/` definitions. Use `const: { $fixture: name }` for a fixture-dependent equality check. Assertions use JSON Pointer paths: `{path: /value/0, equalsPath: /value/2}`, `{path: '', orderBy: /slot, direction: descending}`, or `{path: /result/value/data/0, base64Bytes: 40}`. An empty path selects the whole result. `*` expands array elements; `~0` and `~1` escape `~` and `/`.

### Optional matrices and setup

Most tests need no setup or matrix. Use a matrix when the same test applies to several parameter combinations:

```yaml
tests:
  - name: commitment
    matrix:
      level: [processed, confirmed, finalized]
    params: [{ commitment: { $matrix: level } }]
```

Each matrix dimension expands in declaration order and appends its value to the case name. Names must be unique after expansion. A case may expand to at most 1,000 variants. Fixture placeholders work recursively in parameters and assertions. `{ $fixture: tip, offset: -32 }` applies a safe integer offset. `default` supplies a fallback value or another placeholder. `requires: [signature]` explicitly skips a case when a fixture is absent.

Tests may capture successful result values with `capture: {subscription: ''}`. Later tests in the same method can use `{ $fixture: subscription }`. Captures do not leak between methods. An optional top-level `testSetup` list can invoke another method with a nonempty test list on the same transport, with `method`, `params`, and optional `capture`. Setup results appear separately in the report and may be outside the selected method scope. Methods without tests cannot be setup targets.

WebSocket methods use the same executor. Declare `observe: true` and `subscription: { $fixture: subscription }` instead of `params` to inspect notifications. The runner checks the notification envelope and the method's `notification.schema`; assertion paths address the notification's `params` object. Each method and its setup share one connection, which closes after its cases finish. See `methods/websocket/accountSubscribe.yaml` and `accountUnsubscribe.yaml` for complete examples.

### Shared fixtures and validation

Shared fixture declarations live in `compatibility.yaml`. Each fixture has a `schema` and optionally a `value` or `generate: {bytes: 32}`. Without either, it must come from an override or discovery. A discovery group lists the fixtures it `provides` and sequential `steps`. Each step declares `method`, `params`, and captures. A capture selects a `path`, optionally filters candidates with a `where` JSON Schema, selects a `field` path, and applies an integer `offset`. The first candidate is used only if it matches the fixture schema. Overrides always win. A group runs only when the selected tests need one of its missing fixtures. A discovery target present in this spec must have a nonempty test list; explicit discovery calls outside the seed spec are also supported.

`npm run validate` checks test declarations, references, assertion schemas, matrix names, setup targets, and resolvable positive requests. Runtime checks validate requests again after dynamic captures resolve. Invalid definitions fail before endpoint access; missing runtime data produces explicit skips.

Source YAML uses plain field names. Only the generated OpenRPC document needs extension prefixes: `tests` becomes `x-tests`, `category` becomes `x-category`, and optional `testSetup` becomes `x-test-setup`. Shared configuration is preserved as root-level `x-test-config`.

## Coverage and limits

The runner validates shared schema references with the same AJV helper used by the spec tooling. Behavior probes cover account encoding defaults and variants, null and duplicate account entries, response wrapping, filters, token ownership, block detail and reward flags, transaction encodings, history ordering and limits, required parameters, invalid keys, commitment rejection, and minimum context slots.

Error data is validated whenever the method declares a schema for that code. Only probes that declare an exact normative error message compare message text. A declared operational error is reported as inconclusive rather than a successful behavior test. Error code collisions or undeclared codes remain failures regardless of implementation notes.

This is sampled coverage. It does not exhaustively test fork behavior, retention boundaries, transaction version gating, pagination, all filter combinations, every error payload, every encoding's decoded contents, or all prose requirements. Numeric values use JavaScript `number`; comparisons cannot establish exact integer compatibility above `2^53`. A successful schema check alone cannot prove data correctness.

Add tests and categories to the method YAML, and shared fixture or discovery declarations to `compatibility.yaml`. TypeScript changes are needed only for a new generic execution or assertion capability, not for a new RPC method. Prose requirements do not execute automatically: express them as cases and assertions. Add deterministic tooling tests for false positives and coverage gaps. Never use internal endpoints in committed tests, examples, or reports.

Run `npm test`, `npm run validate`, `npm run build`, and `npx tsc --noEmit` before submitting changes.
