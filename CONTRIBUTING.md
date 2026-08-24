# Contributing

## Adding or changing a method

1. Read [GOVERNANCE.md](GOVERNANCE.md) — substantive changes need a proposal.
2. Every method is a pair: `methods/<transport>/<name>.yaml` and
   `methods/<transport>/<name>.md`. CI rejects unpaired files.
   - `.yaml`: machine-readable — params/result/errors as JSON Schema,
     examples, `implementations` support matrix. No prose beyond summaries.
   - `.md`: normative prose — semantics, edge cases, an
     `## Implementation notes` section for documented deviations.
3. Shared types go in `schemas/<Name>.yaml`, referenced as
   `$ref: '#/components/schemas/<Name>'`. Don't inline a type used twice.
4. Errors must reference `errors/codes.yaml` entries via
   `$ref: '#/components/errors/<Name>'`. New codes: see GOVERNANCE.md.
   List `InvalidParams` in a method's `errors` if and only if the method has at
   least one required positional parameter; the five JSON-RPC standard errors
   (`ParseError`, `InvalidRequest`, `MethodNotFound`, `InvalidParams`,
   `InternalError`) are otherwise universal and are not listed per method.
5. Give every method at least one example; CI validates examples against
   the schemas — this is how the spec's return types stay honest.
6. Where a return shape varies (by encoding, by a config flag), model it as
   an explicit `oneOf` with titled variants — never leave variance implicit
   in prose.

## Style

- YAML: 2-space indent. Schema files are PascalCase; method files are the
  exact wire method name.
- JSON Schema: draft-07 subset (OpenRPC 1.2.6). Use `items: [a, b]` tuple
  form, not `prefixItems`.
- Nullable is always an explicit `oneOf: [T, {type: 'null'}]`.
- To attach a field-specific description to a `$ref`, wrap it as
  `allOf: [{$ref: ...}]` with a sibling `description` — draft-07 ignores
  sibling keywords next to a bare `$ref`.

## Checks

Run `cd tooling && npm install && npm run validate` before pushing. CI runs
the same command plus the tooling unit tests. `npx tsc --noEmit` (from
`tooling/`) keeps the tooling itself typechecked.
