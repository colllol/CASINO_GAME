# 0004 - Phase 2 local persistence implementation and contract tests

- Status: Open
- Priority: P0
- Type: Feature
- Owner: Owner
- Surface: Backend
- Dependencies: `management/backlog/0003-phase1-rules-and-local-backend-contract.md`,
  `management/decisions/0001-engine-and-service-stack.md`,
  `management/decisions/0003-phase1-rules-revision.md`
- Orca Run: `run_48a5d2b749e8`
- Orca Task: `task_e8d45c9c8d2c` (Codex, Dispatch `ctx_003fbbe852ba`, child `phase2-backend`)

## Context

Phase 1 established a versioned, in-process, file-backed persistence contract. The Owner
approved the local adapter boundary and deferred the external TypeScript/PostgreSQL service.
Related-ticket search found no existing implementation ticket for the adapter. Four-signal
rubric: one backend surface, addition, product direction already approved, and an internal
contract consumed by future Unreal/server code.

## Scope

Implement a local TypeScript adapter under `backend/` with no HTTP or external service:

- versioned store and forward-only migrations;
- atomic profile/server record writes using temp-file replacement;
- transaction groups for wallet/pool/inventory changes;
- process-wide single-writer lock;
- caller-supplied idempotency keys returning the first stored result on replay;
- append-only event log with monotonic sequence and replay reconstruction;
- fail-closed validation for robbery and jackpot server-only config;
- reconnect hydration fixtures for wallet, heat, inventory, role, quest, and job state;
- deterministic tests for PA1-PA20, EL1-EL17, RB6-RB16, G12-G17 and the relevant T tests.

The adapter API must remain in-process and transport-neutral. Use JSON files for the local
store and keep the replacement seam documented for the future PostgreSQL service.

Allowed surfaces: `backend/`, `tests/backend/`, `projects/backend/documents/`, and `Tools/`
scripts directly needed to run the adapter tests. Do not edit Unreal source, game-design
rules, public APIs, database schemas, credentials, or deployment configuration.

## Out of scope

- HTTP/gRPC/socket API.
- PostgreSQL, cloud services, EOS credentials, authentication, or public deployment.
- Unreal replication or gameplay integration.
- Voluntary player trading or real-money value.

## Acceptance criteria

- A clean install can run the adapter test command on Windows with Node.js.
- Tests cover idempotent replay, atomic transaction groups, event ordering, crash-safe file
  replacement behavior, migration refusal/backup, protected loot classification, and config
  validation.
- Event replay reconstructs wallet containers and jackpot pool without divergence.
- Concurrent writes serialize and cannot double-apply a robbery, casino round, job payout, or shop purchase.
- No HTTP/API/schema/deployment files are introduced.
- Exact commands, test counts, observed behavior, changed files, and residual risks are recorded.

## Verification plan

- `npm ci` or the repository's documented package install command.
- Unit/integration test command with pass/fail counts.
- A Windows filesystem smoke test for atomic replacement and restart hydration.
- Scope, ASCII, whitespace, and Markdown-link audits.
- Review against the Phase 1 adapter and event-log documents before merge.

## Outcome

- Files changed: Pending
- Verified via: Pending
- Evidence: Pending
- Harness delta: Pending
