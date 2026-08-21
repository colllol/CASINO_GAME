# Local profile and persistence adapter (Phase 1)

- Status: Proposed for Owner review
- Surface: Backend
- Ticket: `management/backlog/0003-phase1-rules-and-local-backend-contract.md`
- Phase: 1
- Related decisions: `management/decisions/0001-engine-and-service-stack.md` (proposed),
  `management/decisions/0003-phase1-rules-revision.md` (proposed)
- Owner gate: D25
- Companion document: `authoritative-event-log.md`

This document is normative for what Phase 1 persists, the interface the game server uses to
persist it, how records are versioned and migrated, and how this implementation is later
replaced by the TypeScript/PostgreSQL service without touching gameplay code.

It does **not** define an HTTP API, a wire protocol, or a SQL schema. Those require Decision
0001 approval and are listed as out of scope in section 11.

## 1. Why a local adapter and not the real service

Decision 0001 proposes TypeScript plus PostgreSQL and is still an open Owner gate (D16).
Phase 1 has to prove the rules work: robbery settlement, jackpot pool accounting, heat,
reconnect, and idempotent payouts. Every one of those needs durable state. Waiting for D16
blocks the phase; picking a service shape now front-runs the Owner's decision.

The resolution is a **local, in-process, file-backed adapter behind an interface narrow enough
that replacing the implementation is a backend-only change.** The gameplay code calls the
interface, never the files.

The cost of getting this wrong is named as risk R14 in `gdd-casino-world-mvp.md`: a local
adapter that becomes load-bearing is expensive to replace. Sections 3, 4, and 10 exist
specifically to keep that from happening, and section 10 is the one to re-read before adding
anything to the public surface.

## 2. Scope of persisted state

Persisted state is exactly the state whose loss would be visible to a player or would break an
invariant. Everything else is derived at runtime and is not written.

### 2.1 Player profile record

One record per player identity, keyed by `playerId`. The field set mirrors the character
definition in `gdd-casino-world-mvp.md` section 6 and nothing else.

| Group | Fields | Source of truth |
| --- | --- | --- |
| Identity | `playerId`, `displayName`, `createdAtUtc`, `lastSeenUtc` | Adapter |
| Wallet | `cashCarried`, `cashBanked`, `chips` | `economy-closed-loop.md` 2 |
| Meters | `standing`, `heat`, `heatLastDecayUtc` | `police-and-heat.md`, `hidden-quest-back-room.md` |
| Liability | `outstandingDebt` | `police-and-heat.md` 6 |
| Inventory | Owned item instances: `instanceId`, `catalogueId`, `bound`, `grantReason`, `grantedAtUtc` | `shop-and-cosmetics.md` |
| Loadout | Equipped `instanceId` per the 6 cosmetic slots | `shop-and-cosmetics.md` |
| Employment | `role` in `NONE`, `DEALER`, `FLOOR_MANAGER`, `OWNER`, `SUCCESSOR`; `shiftState` | `jobs-and-employment.md` |
| Quest | `questStage` in `Q0`..`Q5`, per-stage completion set, note fragments held | `hidden-quest-back-room.md` |
| Job | Active `jobInstanceId` and its resumable progress, if any | `jobs-and-employment.md` 1 |
| Robbery | `robberyCooldownUntilUtc`, `victimImmunityUntilUtc` | `robbery-and-pvp.md` 2.1 |

Wallet fields are integers in minor units with no fractional representation, per economy
invariant I2. There is no floating-point money field anywhere in the record, in the file
format, or in the interface.

`bound` is stored on the item **instance**, not derived from the catalogue, because
`robbery-and-pvp.md` section 3.3 makes it a property of the grant. An implementation that
recomputes it from a catalogue lookup will eventually disagree with the grant that set it.

### 2.2 Server record

Server-scoped singletons that are not owned by any player. These are the records most likely
to be mistakenly modelled as wallets, so the table states plainly that they are not.

| Field | Meaning | Rule |
| --- | --- | --- |
| `houseMarginAccrued` | Pool credited by sink S1 as rounds settle | Pool, not a wallet; never negative; drawn only per invariant I8 |
| `jackpotPoolAccrued` | Jackpot pool for the single jackpot cabinet | Pool, not a wallet; credited only by its own machine's margin (G14) |
| `ownerSeatHolder` | The one `OWNER`, or empty | At most one per server (HQ5) |
| `floorManagerSeatHolder` | The one `FLOOR_MANAGER`, or empty | At most one per server (HQ5) |
| `successorQueue` | Ordered `SUCCESSOR` players awaiting the owner seat | No buyout is debited while queued (HQ7) |
| `casinoUpkeepDueUtc` | Next S5 upkeep charge | Owners only |
| `schemaVersion` | Record format version for the whole store | Section 4 |
| `economyParameters` | The configured values of every parameter in section 9 | Refuses unset values (I14) |

### 2.3 Idempotency record

One record per idempotency key: the key, the operation, the stored result, and a timestamp.
This is what makes invariant I4 true rather than aspirational. Details in section 5.

### 2.4 Event log

The append-only authoritative event stream is persisted by the same adapter but has its own
contract, taxonomy, and replay rules. It is specified in `authoritative-event-log.md` and is
referenced here only so that the store's contents are fully enumerated.

### 2.5 Deliberately not persisted

Character transform and velocity, camera state, animation state, current zone occupancy, the
in-flight robbery state machine, table round state mid-round, replicated pool display values,
and any client-supplied value of any kind. A crash mid-round is resolved by the round
settlement rules (G4) and a crash mid-robbery by RB9, not by restoring a snapshot.

## 3. The interface

The public surface is a small set of operations. The constraint that matters is what does not
appear in it: no SQL, no file path, no connection object, no transport type, no query language,
and no cursor. If a gameplay caller can tell that the current implementation writes files, the
interface has leaked.

| Operation | Contract |
| --- | --- |
| `LoadProfile(playerId)` | Returns the full profile record, or creates it with the starter loadout on first call. Never partial |
| `SaveProfile(profile, idempotencyKey)` | Writes the whole record atomically. Last writer for a `playerId` wins; there is only ever one (section 7) |
| `ApplyWalletMutation(mutation, idempotencyKey)` | The only path that changes a wallet field. Emits its ledger event. Returns the stored result on replay |
| `ApplyTransactionGroup(group, idempotencyKey)` | Applies several mutations across one or more profiles and the server record as one unit. This is how a robbery settlement, a shop purchase, and a round settlement are written |
| `LoadServerRecord()` / `SaveServerRecord(record, idempotencyKey)` | Same contract as the profile pair, for section 2.2 |
| `AppendEvents(events)` | Append-only, ordered, per `authoritative-event-log.md` |
| `ReadEvents(fromSequence, limit)` | Replay for reconstruction and audit; read-only |
| `Migrate()` | Runs at startup only, per section 4 |

`ApplyTransactionGroup` is the operation that carries the weight of the phase. Robbery
settlement (RB6), shop purchase atomicity (SH1), round settlement (G2), and jackpot payout
(G13) are all multi-record and all must be all-or-nothing. A design where gameplay code calls
`ApplyWalletMutation` twice and hopes both land is the defect this operation exists to prevent.

There is deliberately **no** operation that moves value from one `playerId` to another as a
primitive. A robbery is expressed as a transaction group whose legs the robbery state machine
constructed after passing its own preconditions, which is what keeps economy invariant I9 and
RB16 true: there is no transfer endpoint to find, only a settlement of a state machine that
already ran.

## 4. Versioning and migration

The whole store carries one `schemaVersion` integer. Records do not carry individual versions;
one version for the store is simpler to reason about and there is no scenario in Phase 1 where
two record kinds need to diverge.

Rules, all of them fail-closed:

1. The adapter refuses to start on a `schemaVersion` **higher** than it understands. A newer
   build wrote that store; opening it read-write would silently discard fields.
2. On a lower version, `Migrate()` runs forward-only migrations in order, one version step at a
   time, and writes the new version only after all steps succeed.
3. A migration takes a full backup copy of the store first and leaves it in place on failure.
4. Migrations are idempotent and re-runnable: interrupted halfway, the next start completes.
5. There are no down-migrations. Rolling back means restoring the backup.
6. An unknown field in a record is preserved, not dropped, so a partial rollback does not
   destroy data written by a newer build.

Rule 1 is the one that gets removed by an implementer who finds it inconvenient during
development. It is the only thing standing between a version mismatch and silent data loss.

## 5. Idempotency

Every mutating operation takes an idempotency key. The key is supplied by the caller and is
derived from the game event, never generated randomly at the call site: `roundId` for a casino
round (G2), `robberyId` for a robbery settlement (RB8), `jobInstanceId + playerId` for a job
payout, the quest stage ID for a stage reward (HQ3), and the purchase ID for a shop purchase
(SH6).

The stored-result rule: on a repeat of a seen key, the adapter performs no mutation and returns
the **stored result of the first application**, not merely a success code. A caller that
retries after a timeout must be unable to distinguish "applied now" from "applied before" in
any way that changes what it does next.

Key scope is the store, not the session, so a key survives a server restart. Keys are retained
at least as long as the event log they correspond to; Phase 1 retains them for the life of the
store, because a local single-server MVP has no volume problem and expiring keys is a way to
reintroduce double payouts.

A key collision across two genuinely different operations is a defect in the caller's key
derivation, and the adapter reports it as an error rather than returning the wrong stored
result. Silently returning the previous result for a different operation would be worse than
failing.

## 6. Atomicity and durability on Windows

The MVP target is a Windows dedicated server (`gdd-casino-world-mvp.md` section 5), so
durability is specified against Windows file semantics rather than assumed from POSIX habits.

| Concern | Rule |
| --- | --- |
| Record write | Write to a temporary file in the same directory, flush to disk, then replace the target by an atomic replace operation |
| Transaction group | Write an intent journal entry naming every leg, then apply, then mark the journal entry complete |
| Crash recovery | On start, an incomplete journal entry is either fully replayed or fully discarded; never partially applied |
| Event log | Append, then flush, before the mutation that the event describes is acknowledged to the caller |
| Directory durability | Flush the containing directory after a replace, so a crash cannot leave the rename unrecorded |
| Locking | Exclusive lock on the store directory, held for the process lifetime; a second server refuses to start |

The ordering in row 4 is the important one and it is easy to get backwards. The event is
durable **before** the acknowledgement, so the log can never be missing an effect that the
game already told a player about. A log that lags the state it describes cannot be used to
reconstruct pool balances (G14) or to audit a robbery (RB14), which is most of the reason the
log exists.

Fsync-per-write is affordable here. Ten players generate a low write rate, and trading
durability for throughput at this scale buys nothing and costs the phase its evidence.

## 7. Concurrency model

One process, one writer, one store. The game server is the only writer; there is no second
service, no background job, and no external tool with write access.

Within the process, mutations are serialised per store, not per player. Serialising per player
would be faster and is wrong: robbery settlement, the owner seat, and both pools all touch
records belonging to different players or to no player, and a per-player lock cannot make those
groups atomic.

At ten concurrent players this is not a throughput concern. Stating the model explicitly
matters anyway, because "make it per-player for performance" is a plausible-sounding change
that would break RB6, HQ5, and G15 at once.

Read operations may be concurrent with each other and observe a consistent snapshot; they never
observe a half-applied transaction group.

## 8. Reconnect and hydration

Reconnect is a Phase 1 acceptance criterion, so the adapter's part in it is specified rather
than left to the server implementation.

1. On login the server calls `LoadProfile`, receives the whole record, and hydrates gameplay
   state from it. There is no partial hydration and no lazy field loading.
2. Anything in flight at disconnect was resolved server-side by its own rules before the
   profile was last written: rounds by G4, robberies by RB9 and RB10, pursuit by H4, jobs by
   the `jobInstanceId` resume rule. The adapter restores outcomes, never in-flight interactions.
3. Heat decay across an offline period is computed from `heatLastDecayUtc` at hydration, which
   is why that timestamp is persisted. The exact offline decay rate is Owner decision D7 and the
   adapter stores whatever the configured rate produces.
4. A reconnect that races the previous session's disconnect must not double-apply anything: the
   payouts that could double are all keyed (section 5), which is what makes assertion T16 pass.

## 9. Parameters the adapter must refuse to guess

The adapter loads `economyParameters` at startup and **refuses to start** if any parameter that
this project has left unset is still unset, per economy invariant I14. The values are Owner
decisions and neither this surface nor an implementation agent may default them.

| Parameter group | Owner gate | Document |
| --- | --- | --- |
| `robberyCarriedCashShareBps`, `robberyCarriedCashCap`, `robberyContrabandShare` | D17 | `robbery-and-pvp.md` 6 |
| `robberyCooldownSeconds` | D18 | `robbery-and-pvp.md` 6 |
| `jackpotOutcomeSpace`, `jackpotPaytable`, `jackpotHitOdds`, `jackpotContributionBps`, `jackpotSeed`, `jackpotFixedStake` | D22 | `casino-games-mvp.md` 6.3 |
| Offline heat decay rate | D7 | `police-and-heat.md` 4 |

Refusing to start is deliberate. A zero default would ship a robbery that takes nothing and a
jackpot that never pays, both of which look like working systems in a smoke test and are only
caught in balance testing, long after the code has been trusted.

The narrower alternative is also acceptable and is what `robbery-and-pvp.md` RB13 and
`casino-games-mvp.md` G12 actually require: refuse to **enable the specific system** whose
parameters are unset, while the rest of the server starts. Phase 1 should implement the narrow
form, because it lets the persistence and reconnect work proceed while D17 and D22 are open.

## 10. Replacement path to TypeScript and PostgreSQL

The adapter is a bridge, and the bridge's value is entirely in how cheaply it is removed. Three
properties make the replacement a backend-only change.

**One-to-one record mapping.** Each record kind in section 2 maps to exactly one table. No
record is spread across tables and no table holds two record kinds. The profile record's
repeated groups (item instances, per-stage completion, the successor queue) map to child tables
with a foreign key, which is the only structural change the migration involves.

**No implementation detail in the public surface.** Section 3's operations name records and
groups, never files, rows, connections, or transactions-as-objects. `ApplyTransactionGroup`
becomes a database transaction; `AppendEvents` becomes an insert; `Migrate()` becomes the
service's migration runner. No caller changes.

**Semantics chosen to be the intersection, not the union.** Every rule in sections 4 to 7 is
implementable on both a local file store and PostgreSQL: integer money, whole-record reads,
caller-supplied idempotency keys, serialised writes, forward-only migrations, append-only
events. Nothing depends on a file store being fast at whole-file rewrites, and nothing depends
on SQL features the file store cannot emulate. That is why the interface is narrow rather than
merely small.

Two things must be true at replacement time and are worth writing down now, because they are
cheap to preserve and expensive to reconstruct: the event log must be exportable in sequence
order without loss, and the idempotency keys must migrate with their stored results. Dropping
either turns the cutover into a re-run of every unsettled payout.

The cutover itself, the service's API shape, its schema, its authentication, and its deployment
are all gated on Decision 0001 and are out of scope here.

## 11. Out of scope

- Any HTTP, gRPC, or socket API. Phase 1 is in-process only.
- SQL schema, DDL, ORM choice, connection pooling, or database deployment.
- Identity providers, sessions, tokens, or account recovery. `playerId` is supplied by the
  server's existing login path.
- Encryption at rest, multi-host replication, backup scheduling, and retention policy beyond
  the migration backup in section 4.
- Sharding, read replicas, caching layers, and any horizontal scaling concern. Ten players on
  one host does not have these problems.
- Analytics, telemetry export, or player-facing transaction history UI.
- Anything that would constitute a voluntary transfer path between accounts. Not merely
  unimplemented: forbidden by economy constraint C2 and invariant I9.

The last row is the one an implementation agent is most likely to add helpfully, in the form of
a generic "move value between profiles" utility used by robbery settlement. Robbery must build
its transaction group explicitly so that no reusable transfer primitive exists to be called
from anywhere else.

## 12. Invariants for implementation and test

| ID | Invariant |
| --- | --- |
| PA1 | Every money field is an integer in minor units; no floating-point money exists in the record, the file format, or the interface |
| PA2 | No wallet field is ever negative at rest or mid-transaction |
| PA3 | Every mutating operation requires a caller-supplied idempotency key derived from a game event, never randomly generated |
| PA4 | Replaying a seen key mutates nothing and returns the stored result of the first application |
| PA5 | A key reused for a genuinely different operation is reported as an error, never answered with the prior result |
| PA6 | A transaction group is applied in full or not at all, across every profile and server-record leg it touches |
| PA7 | An interrupted transaction group is fully replayed or fully discarded at next start, never partially applied |
| PA8 | An event is durable before the mutation it describes is acknowledged to the caller |
| PA9 | The adapter refuses to start on a `schemaVersion` higher than it understands |
| PA10 | Migrations are forward-only, ordered, idempotent, re-runnable after interruption, and preceded by a backup |
| PA11 | Unknown fields in a stored record are preserved across load and save |
| PA12 | Writes are serialised per store, not per player |
| PA13 | A second server process refuses to start against a locked store |
| PA14 | `LoadProfile` returns a whole record; there is no partial or lazy hydration |
| PA15 | `houseMarginAccrued` and `jackpotPoolAccrued` are pools, never wallets, and never go negative |
| PA16 | At most one `OWNER` and one `FLOOR_MANAGER` exist in the server record at any instant |
| PA17 | No operation transfers value between two `playerId` values as a primitive |
| PA18 | The public interface exposes no file path, SQL string, connection, or transport type |
| PA19 | The adapter refuses to enable robbery or the jackpot machine while any of their section 9 parameters is unset |
| PA20 | Each record kind in section 2 maps to exactly one table under the Decision 0001 service, with repeated groups in child tables |

PA4, PA6, and PA8 are the three that everything else in Phase 1 rests on: without them,
reconnect double-pays, robbery settles half a transfer, and the event log cannot be trusted to
reconstruct a pool. PA9 and PA10 are the two that protect the data itself. If a test budget
forces a choice, those five come first.

## 13. Open Owner decisions

D16 (confirm Decision 0001, which sets what this adapter is eventually replaced by), D25
(confirm this local adapter for Phase 1), D7 (offline heat decay rate, which this adapter
stores but does not choose), D17 and D22 (the unset parameters in section 9). All recorded in
`projects/game-design/documents/open-owner-decisions.md`.
