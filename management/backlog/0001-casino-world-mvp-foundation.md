# 0001 - Casino world MVP foundation

- Status: Epic
- Priority: P0
- Type: Epic
- Owner: Owner
- Surface: Cross-surface
- Dependencies: None
- Orca Run: `run_48a5d2b749e8`
- Orca Task: `task_8d8efc4240de` (Claude, Dispatch `ctx_beb62d0361b5`); `task_a46b10997d0a` (Codex, Dispatch `ctx_e3adf6bc95c1`; startup failures `ctx_438cb857bae1`, `ctx_8700a08e69fb`)

## Context

Build a supervised, agent-driven foundation for a 3D multiplayer casino entertainment
game with a surrounding open world. Currency is virtual, closed-loop, and cannot be
purchased or redeemed for real money.

Related-ticket search: no pre-existing backlog or bug tickets were present when this
ticket was opened.

Four-signal rubric:

- Blast radius: cross-surface; Owner approval required.
- Change type: addition; Owner approval required.
- Product decision: engine, MVP scope, economy, and multiplayer choices; Owner approval required.
- Contract impact: client/server data and service interfaces; Owner approval required.

Approval recorded: on 2026-08-21 the Owner requested an Orca-managed Codex/Claude workflow
and explicitly requested Gangline as the durable task-management model. Technical choices
remain proposed until the decision record is approved.

Execution note: Phase 0 documentation tasks were dispatched in Orca with non-overlapping
surface fences. The Owner approved Phase 1 on 2026-08-21; implementation remains bounded by
child tickets 0002 and 0003, while external backend/public-release decisions remain gated.

## Scope

1. Approve the engine, language, multiplayer, persistence, and asset pipeline decision.
2. Produce the GDD, architecture, economy, networking, quest, and verification documents.
3. Bootstrap a buildable Unreal project and automated build/test entry points.
4. Deliver an offline prototype with character control, one casino table, one job, and camera transition.
5. Deliver a four-player authoritative-server vertical slice with persistence and reconnect.
6. Add the MVP open-world jobs, hidden quest, police pursuit, shop, and casino ownership loop.

## Proposed execution phases

| Phase | Deliverable | Proposed agent | Depends on |
| --- | --- | --- | --- |
| 0 | GDD, scope, architecture decision, risk register | Claude draft; Codex review | Owner direction |
| 1 | Unreal project bootstrap and offline prototype | Codex | Phase 0 approval |
| 2 | Backend contract and persistence prototype | Claude draft; Codex review | Phase 0 approval |
| 3 | Four-player multiplayer vertical slice | Codex | Phases 1 and 2 |
| 4 | Economy, jobs, shop, quest, police, ownership | Split by non-overlapping surfaces | Phase 3 |
| 5 | QA, balance, performance, packaging | Codex and Claude reviews | Phase 4 |

## Out of scope

- Real-money deposits, withdrawals, tradable tokens, or paid casino currency.
- A production-scale city, massive concurrency, or every real-world casino game in the first release.
- Public deployment, store submission, or irreversible external actions without a fresh Owner gate.
- Final legal classification; professional legal review remains an Owner responsibility.

## Acceptance criteria

- The Owner approves a decision record for the engine and service stack.
- Each phase is decomposed into bounded child tickets before implementation.
- Every Orca Task references its Gangline ticket and has one accountable surface agent.
- The prototype and vertical slice have named build, test, and runtime smoke commands.
- Economy mutations and casino results are authoritative on the server and transaction logged.
- The MVP supports four concurrent players, reconnect, and persistence without duplicating rewards.
- The gameplay loop from job to casino to hidden quest to casino ownership is demonstrable.

## Verification plan

- Run Gangline board audit before and after each phase.
- Build the Unreal editor target and dedicated-server target in CI.
- Run automated gameplay, transaction, persistence, and reconnect tests with counts.
- Run one server plus four clients and record observed behavior for the vertical slice.
- Review every phase against its ticket scope before closing child tickets.

## Phase 0 outcome

Phase 0 documentation is complete. Claude produced nine game-design documents plus proposed
Decision 0002; Codex produced the Unreal architecture document and surface README update.
Both Orca Tasks report `succeeded` and are recorded above. Independent checks on 2026-08-21:

- `git diff --check`: passed.
- ASCII policy scan: passed.
- Local Markdown link audit: 23 files scanned, 0 missing targets.
- Verification assertion audit: T1-T28 present, 28 IDs, 0 missing.
- Slots exhaustive enumeration: 8,000 combinations, 1,148 winning, RTP 94.825%, edge 5.175%.
- Roulette paytable arithmetic: all seven bet families return 36/37 (0.972973), edge 2.7027%.
- Unreal build/runtime: pending because no `.uproject`, Unreal installation, or test harness exists.

Phase 0 is complete. Decision 0001 and Decision 0002 are approved for Phase 1 design/prototype
work. Decisions D1-D16 and any external backend/public-release changes remain tracked as
Owner gates; Phase 1 implementation is dispatched only through child tickets 0002 and 0003.

## Outcome

- Files changed: Phase 0 documents under `projects/game-design/documents/`,
  `projects/unreal/documents/`, and proposed `management/decisions/0002-mvp-economy-and-house-edge.md`.
- Verified via: Orca worker reports; `git diff --check`; PowerShell exhaustive slots and roulette checks;
  Markdown link and assertion-ID audits.
- Evidence: Counts and observed results are recorded in the Phase 0 outcome above and in each surface's
  `verification-notes.md` / `unreal-architecture-mvp.md`.
- Harness delta: Added the 28-assertion design verification checklist, deterministic casino math checks,
  and explicit Owner gates before Unreal/backend implementation.
