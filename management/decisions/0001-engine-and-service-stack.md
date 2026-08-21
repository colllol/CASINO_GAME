# Decision 0001 - Engine and service stack

- Status: Approved for Phase 1
- Owner gate: Approved on 2026-08-21
- Related ticket: `management/backlog/0001-casino-world-mvp-foundation.md`

## Decision to make

Select the initial technology stack for the four-player vertical slice while preserving a
path to a larger authoritative multiplayer game.

## Proposed option

- Unreal Engine 5
- C++ for authoritative gameplay and network-critical systems
- Blueprint for presentation, content wiring, and designer-authored flows
- Unreal dedicated server
- Epic Online Services for identity, lobby, and sessions
- PostgreSQL-backed TypeScript service for durable profile, inventory, and transaction data
- Blender plus licensed Fab/Quixel assets for the initial art pipeline
- Git LFS for Unreal binary assets

## Owner-approved Phase 1 constraints

- Engine: Unreal Engine 5 with C++ for authoritative systems and Blueprint for composition/content.
- Target: Windows PC only.
- Multiplayer: dedicated server, maximum 10 players per MVP server.
- Sessions: EOS integration behind an interface; local/offline adapter is allowed for Phase 1 tests.
- Persistence: Phase 1 uses an interface plus a local server profile store; Phase 2 may implement
  the proposed TypeScript/Node.js + PostgreSQL service after a separate contract gate.
- Workflows: agents work in Orca-managed child worktrees/branches; PM reviews and merges to `main`.

## Alternative

Unity with C# reduces language and build complexity for coding agents, but reaching the
target visual fidelity and first-person casino presentation would require more rendering
and content-pipeline work.

## Consequences

The proposed option favors visual fidelity and native dedicated-server support. It requires
strong C++ ownership, Unreal-aware CI, large binary asset controls, and strict separation
between server authority and Blueprint presentation.

## Owner decision

Approved for Phase 1 on 2026-08-21 by the Owner. The Phase 1 local persistence adapter and EOS
interface are deliberately replaceable; no public deployment or external backend contract is
approved by this decision.
