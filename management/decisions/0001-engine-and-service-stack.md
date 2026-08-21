# Decision 0001 - Engine and service stack

- Status: Proposed
- Owner gate: Required
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

## Alternative

Unity with C# reduces language and build complexity for coding agents, but reaching the
target visual fidelity and first-person casino presentation would require more rendering
and content-pipeline work.

## Consequences

The proposed option favors visual fidelity and native dedicated-server support. It requires
strong C++ ownership, Unreal-aware CI, large binary asset controls, and strict separation
between server authority and Blueprint presentation.

## Owner decision

Pending. Record approval, rejection, or requested changes here before Phase 1 begins.
