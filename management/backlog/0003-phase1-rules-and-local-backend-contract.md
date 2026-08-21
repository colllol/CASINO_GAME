# 0003 - Phase 1 rules update and local backend adapter contract

- Status: Open
- Priority: P0
- Type: Feature
- Owner: Owner
- Surface: Game design + Backend
- Dependencies: `management/decisions/0001-engine-and-service-stack.md`,
  `management/decisions/0002-mvp-economy-and-house-edge.md`
- Orca Run: `run_48a5d2b749e8`
- Orca Task: `task_cc01da393ffa` (Claude, Dispatch `ctx_acc30988cf83`; previous startup dispatch `ctx_f99270d7e966` failed after compact/update retries; child `phase1-rules-backend`)

## Context

The Owner confirmed a 10-player Windows MVP, four casino games including a jackpot machine,
no voluntary player trading in the MVP, and robbery of carried loot/cash outside the casino
safe zone with automatic PvP activation. Related-ticket search found no existing Phase 1 rules
or adapter ticket. Four-signal rubric: cross-surface documentation, addition, explicit product
choices, and a future service-contract impact. The task may propose interfaces but must not
publish or deploy an external API without a later Owner gate.

## Scope

Update game-design documents to reflect jackpot machine, 10-player assumptions, and the
robbery boundary. Define the local profile/persistence adapter contract needed by the Phase 1
Unreal prototype: profile load/save, idempotency key, wallet/inventory snapshots, and a clear
replacement seam for the future TypeScript/PostgreSQL service. Specify that only `LOOTABLE`
carried cash/items can be stolen; equipped cosmetics, quest-critical, bound, and starter
protection items are excluded. Add testable rules for robbery, safe-zone blocking, PvP state,
heat, and jackpot result logging.

Allowed surfaces: `projects/game-design/documents/`, `projects/backend/documents/`, and a
proposed decision record only when a new Owner gate is necessary. Do not edit Unreal source.

## Out of scope

- External backend deployment, EOS credentials, player trading, or real-money features.
- Balancing final robbery loss percentages or jackpot odds without recording an Owner decision.
- Implementing network replication or server code.

## Acceptance criteria

- All normative design docs agree on the four-game MVP and the 10-player limit.
- Robbery is explicitly distinguished from voluntary trading and has safe-zone/PvP/lootability
  rules that can be implemented server-side.
- The local adapter contract is versioned, idempotent, and replaceable by the proposed backend.
- Jackpot outcomes include an auditable server result and no client-controlled RNG.
- Verification notes contain numbered assertions for each new rule and list unresolved Owner gates.
- No files outside the assigned surfaces are changed.

## Verification plan

- Cross-document consistency audit for currencies, game IDs, robbery flags, and player limit.
- Markdown link audit and `git diff --check`.
- Count all new verification assertions and record unresolved decisions.
- No runtime evidence is expected from this documentation/contract task.

## Outcome

- Files changed: 15 files on branch `d290b4f`, merged into `main`: game-design rule updates,
  `robbery-and-pvp.md`, local profile adapter, authoritative event log, backend README, and
  proposed Decision 0003.
- Verified via: Claude/ORCA worker report; `git diff --check`; 25-file ASCII/whitespace scan;
  Markdown, assertion, invariant, and scope audits.
- Evidence: 25 files scanned, 0 non-ASCII, 0 tabs, 0 trailing whitespace; 30 Markdown files and
  94 local targets with 0 missing after PM base reconciliation; T1-T78 with 0 duplicates/gaps;
  94 cited invariants all defined; 0 files outside the worker fence. No runtime/API/deployment
  evidence was expected or claimed.
- Harness delta: Added PA1-PA20 and EL1-EL17 persistence/event-log invariants, robbery/jackpot
  refusal rules, and T29-T78 verification assertions. D17, D18, and D22 remain fail-closed gates.
