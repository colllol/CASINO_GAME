# 0006 - Phase 3 ten-player multiplayer vertical slice

- Status: Awaiting Owner
- Priority: P0
- Type: Feature
- Owner: Owner
- Surface: Unreal + Backend + QA
- Dependencies: `management/backlog/0002-phase1-unreal-bootstrap.md`,
  `management/backlog/0004-phase2-local-persistence-implementation.md`
- Orca Run: `run_48a5d2b749e8`
- Orca Task: Pending

## Context

Phase 3 is the first cross-surface runtime slice: one Windows dedicated server and up to 10
clients with reconnect, persistence, authoritative table interaction, and a basic job-to-casino
loop. It cannot start runtime implementation until the Unreal Engine 5.4 toolchain is installed
and ticket 0002 has Editor/Server/offline smoke evidence.

Four-signal rubric: cross-surface addition with multiplayer and persistence contracts. Product
direction is approved; execution is gated on the missing local UE5 toolchain and the runtime
evidence from ticket 0002.

## Planned scope

- Dedicated server/client session on Windows, max 10 players.
- EOS/local session adapter behind the existing seam.
- Server-authoritative movement/interaction, table seat/camera state, one job payout,
  reconnect hydration, and one casino round.
- Four-client smoke first, then ten-client soak and contention checks.
- No robbery combat, final jackpot balancing, shop economy, or public deployment in this ticket.

## Owner gate

Install/provision Unreal Engine 5.4 on the build host and set `UNREAL_ROOT`, then rerun:

```powershell
Tools/Build-OfflinePrototype.ps1 -Target Editor
Tools/Build-OfflinePrototype.ps1 -Target Server
Tools/Run-OfflineSmoke.ps1
```

Move this ticket to Open only after those commands produce observed evidence.

## Outcome

- Files changed: Pending
- Verified via: Pending
- Evidence: Pending
- Harness delta: Pending
