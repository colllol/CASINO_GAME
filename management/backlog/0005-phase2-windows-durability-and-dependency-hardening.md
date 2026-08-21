# 0005 - Phase 2 Windows durability and dependency hardening

- Status: Open
- Priority: P1
- Type: Hardening
- Owner: Owner
- Surface: Backend + QA
- Dependencies: `management/backlog/0004-phase2-local-persistence-implementation.md`
- Orca Run: `run_48a5d2b749e8`
- Orca Task: `task_54c066c10cc9` (Claude, Dispatch `ctx_760ec4fc8b1b`, child `phase2-hardening`)

## Context

Phase 2 passed its 67-test contract suite, but the worker reported two residual risks:
`npm audit` found 5 dependency vulnerabilities (3 moderate, 1 high, 1 critical), and the
Windows file replacement fallback removes the target before rename. This ticket is a bounded
follow-up, not a reason to reopen the closed adapter ticket.

Four-signal rubric: one backend/QA hardening surface, correction, no product decision, internal
durability/security behavior. No Owner gate is required for investigation and patching; any
dependency upgrade that changes runtime behavior must preserve the 67-test contract.

## Scope

- Replace the Windows `rm` + `rename` fallback with a crash-safe replace strategy and an
  integration test that simulates target-exists behavior.
- Run `npm audit`, classify direct/transitive findings, upgrade or pin safe versions, and rerun
  typecheck/tests. Do not weaken the audit by ignoring findings without a written reason.
- Add a documented recovery procedure for interrupted journal/store replacement.

## Out of scope

- External API, PostgreSQL, cloud deployment, Unreal integration, or public release.
- Changing economy/gameplay rules.

## Acceptance criteria

- Windows atomic replacement behavior is tested or explicitly documented as a remaining platform
  limitation with a reproducible evidence command.
- Audit findings are reduced or each residual finding has a named package, severity, rationale,
  and follow-up.
- `npm run check` and all adapter tests remain green with counts recorded.

## Outcome

- Files changed: Pending
- Verified via: Pending
- Evidence: Pending
- Harness delta: Pending
