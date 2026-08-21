# Backend surface

Owns identity integration, profiles, persistence, inventory, transaction ledgers, idempotency,
reconnect behavior, audit logs, and service contracts. Schema and API changes require an
Owner-approved decision record.

## Documents

| Document | Contents |
| --- | --- |
| [local-profile-persistence-adapter.md](local-profile-persistence-adapter.md) | What Phase 1 persists, the adapter interface, versioning and migration, idempotency, Windows durability, and the replacement path to TypeScript/PostgreSQL |
| [authoritative-event-log.md](authoritative-event-log.md) | The append-only server-authoritative event stream: envelope, closed event taxonomy for money, robbery, heat, and jackpot, and the reconstruction procedure |

Both are Proposed for Owner review under
`management/backlog/0003-phase1-rules-and-local-backend-contract.md` and depend on D25 plus
the unresolved D17/D18/D22 game parameters. Neither defines an HTTP API, a wire protocol, or a
SQL schema: those remain out of Phase 1.

Phase 1 is deliberately in-process and local. The TypeScript/PostgreSQL service proposed in
`management/decisions/0001-engine-and-service-stack.md` is deferred, and the adapter interface is
scoped so that adopting it is a backend-only change.
