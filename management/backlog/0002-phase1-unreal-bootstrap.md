# 0002 - Phase 1 Unreal bootstrap and offline prototype

- Status: Open
- Priority: P0
- Type: Feature
- Owner: Owner
- Surface: Unreal
- Dependencies: `management/decisions/0001-engine-and-service-stack.md`
- Orca Run: `run_48a5d2b749e8`
- Orca Task: `task_e50d59388e15` (Codex, Dispatch `ctx_5ffd5badc75e`, child `phase1-unreal`)

## Context

The Owner approved Phase 1 on 2026-08-21: Unreal Engine 5 with C++/Blueprint, Windows PC,
and a maximum of 10 players per server. Related-ticket search found no existing Phase 1
child ticket. Four-signal rubric: one Unreal surface, addition, approved product direction,
and internal project/build contracts. The host currently has no Unreal installation, so
runtime/build evidence may remain blocked until the toolchain is installed.

## Scope

Create the first buildable Unreal project skeleton and offline prototype boundary. The
prototype must include a controllable character, one small test district, one job marker,
one casino table interaction, and third-person to table-view camera transition. Include
typed data stubs for slots, roulette, blackjack, and jackpot machine, but do not implement
all four full games in this ticket. Enforce the 10-player server capacity constant and
keep the local persistence/EOS adapters replaceable.

Allowed surfaces: `.uproject`, `Source/`, `Config/`, `Content/` test assets, `Tools/` Unreal
build scripts, and `projects/unreal/documents/` implementation notes. Do not edit game-design
documents, backend contracts, or production economy rules.

## Out of scope

- Production backend, EOS credentials, public services, or deployment.
- Full casino game settlement, robbery, police AI, shop, or ownership implementation.
- Licensed final art, custom avatar creator, or marketplace integration.

## Acceptance criteria

- A named Unreal project and game module exist with Editor and Server target intent.
- C++/Blueprint boundary follows the approved Unreal architecture document.
- Offline mode can launch the test map, move the character, enter/exit table interaction,
  and blend to/from table camera state.
- A server capacity constant is set to 10 and is covered by a test/config assertion.
- Casino game IDs include `SLOTS`, `ROULETTE`, `BLACKJACK`, and `JACKPOT_MACHINE` as data,
  without pretending their settlement logic exists.
- Build and automation commands are documented. If Unreal is unavailable, report the exact
  blocker and verify all non-engine files with deterministic checks.

## Verification plan

- `git diff --check` and scope audit.
- When Unreal is installed: editor target build, server target build, and one offline smoke run.
- When Unreal is absent: project/config/schema static checks and explicit blocked evidence.
- Record changed files, commands, counts, and observed behavior in Outcome.

## Outcome

- Files changed: Pending
- Verified via: Pending
- Evidence: Pending
- Harness delta: Pending
