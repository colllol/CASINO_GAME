# Backlog Status

This file is a derived index. Ticket files are authoritative for existence; each ticket's
`Status` field is authoritative for its lane.

## Epics

| ID | Priority | Title | Surface | Agents | Waiting on | Detail |
| --- | --- | --- | --- | --- | --- | --- |
| [0001](0001-casino-world-mvp-foundation.md) | P0 | Casino world MVP foundation | Cross-surface | Claude, Codex | Owner | Phase 1 active; Unreal toolchain and post-MVP balance gates remain |

## Open

| ID | Priority | Title | Surface | Agents | Waiting on | Detail |
| --- | --- | --- | --- | --- | --- | --- |
| [0002](0002-phase1-unreal-bootstrap.md) | P0 | Phase 1 Unreal bootstrap and offline prototype | Unreal | Codex | Unreal toolchain | Static pass merged `b0241b6`; install UE5.4 for Editor/Server/offline smoke |
| [0005](0005-phase2-windows-durability-and-dependency-hardening.md) | P1 | Phase 2 Windows durability and dependency hardening | Backend + QA | Claude | None | `task_54c066c10cc9`; audit vulnerabilities and atomic replacement follow-up |
## Awaiting Owner

| ID | Priority | Title | Surface | Agents | Waiting on | Detail |
| --- | --- | --- | --- | --- | --- | --- |
| [0006](0006-phase3-multiplayer-vertical-slice.md) | P0 | Phase 3 ten-player multiplayer vertical slice | Unreal + Backend + QA | Codex | UE5.4 runtime evidence | Do not dispatch until ticket 0002 builds and offline smoke pass |

## Closed

| ID | Priority | Title | Surface | Agents | Waiting on | Detail |
| --- | --- | --- | --- | --- | --- | --- |
| [0003](0003-phase1-rules-and-local-backend-contract.md) | P0 | Phase 1 rules and local backend adapter contract | Game design + Backend | Claude | None | Closed with T1-T78/audit evidence; post-MVP balance tuning is follow-up work |
| [0004](0004-phase2-local-persistence-implementation.md) | P0 | Phase 2 local persistence implementation and contract tests | Backend | Codex | None | Closed `c062539`; 67/67 tests, typecheck pass; residual hardening follow-up |
