# Authoritative event log (Phase 1)

- Status: Proposed for Owner review
- Surface: Backend
- Ticket: `management/backlog/0003-phase1-rules-and-local-backend-contract.md`
- Phase: 1
- Related decisions: `management/decisions/0003-phase1-rules-revision.md` (proposed)
- Companion document: `local-profile-persistence-adapter.md`

This document is normative for the append-only event stream that records everything the server
decided: money movements, robbery arbitration, heat changes, and jackpot pool accounting.

It exists because three design documents assert a logging obligation without defining one:
`robbery-and-pvp.md` RB14 (every robbery transition and settlement writes an append-only
authoritative event), `police-and-heat.md` H8 (every heat mutation names its server-observed
cause), and `casino-games-mvp.md` 6.4 (the jackpot pool balance must be reconstructable by
replaying the log from the seed). One contract satisfies all three.

## 1. What the log is for

Three jobs, in order of how much they constrain the design:

1. **Reconstruction.** Pool balances and wallet balances must be derivable by replaying the log.
   This is what makes `jackpotPoolAccrued` auditable (G14) and what makes a disputed robbery
   answerable rather than a matter of opinion.
2. **Evidence.** The PM playbook forbids closing a ticket on an agent claim. Transaction
   invariants for money, inventory, rewards, and casino outcomes are named evidence, and this
   log is where that evidence comes from.
3. **Debugging server authority.** Every entry names the server-observed cause. A log full of
   effects with no causes cannot distinguish a rules bug from a cheating client.

The log is **not** a message bus, not a replication channel, not analytics, and not a save
file. State lives in the records described in `local-profile-persistence-adapter.md` section 2;
the log explains how the state got there.

## 2. Envelope

Every event carries the same envelope. Fields are fixed; the per-type payload is the only part
that varies.

| Field | Meaning |
| --- | --- |
| `sequence` | Monotonic, gapless, store-scoped integer assigned by the adapter on append |
| `eventId` | Stable unique identifier for this event |
| `occurredAtUtc` | Server clock at the decision, not at the write |
| `type` | One of the types in section 3 |
| `actorPlayerId` | The player whose action caused it, or empty for server-caused events |
| `subjectPlayerId` | The player affected, when different from the actor (a robbery victim) |
| `groupId` | Shared by every event belonging to one transaction group |
| `idempotencyKey` | The key under which the mutation was applied, when there was one |
| `cause` | The server-observed reason, from a closed enumeration per type |
| `payload` | Type-specific fields, integers only for money |

`groupId` is what makes a multi-leg settlement readable. A robbery writes a victim debit and an
aggressor credit; both share the `groupId`, and a group found with one money leg is a defect
(RB6), detectable by reading the log alone.

`cause` being a closed enumeration rather than free text is deliberate. Free-text reasons are
unqueryable within a month and make H8 unverifiable: an assertion that every heat mutation names
a server-observed cause is only testable if the set of legal causes is finite.

## 3. Event taxonomy

Types are grouped by subject. The list is closed for Phase 1: adding a type is a backend ticket,
in the same spirit as the closed faucet and sink lists in `economy-closed-loop.md`.

### 3.1 Money and inventory

| Type | When | Key payload |
| --- | --- | --- |
| `WALLET_CREDIT` | Any increase in `cashCarried`, `cashBanked`, or `chips` | container, amount, faucet ID `F1`-`F5` or `ROBBERY` |
| `WALLET_DEBIT` | Any decrease | container, amount, sink ID `S1`-`S7` or `ROBBERY` or `CAGE` |
| `CAGE_CONVERSION` | Deposit, withdrawal, chip buy, chip cash-out | direction, amount, resulting containers |
| `ITEM_GRANT` | Any item instance created for a player | `instanceId`, `catalogueId`, `bound`, grant reason |
| `ITEM_DESTROY` | Contraband destroyed on arrest | `instanceId`, cause `ARREST` |
| `ITEM_TRANSFER` | The only item movement between players: contraband taken in a robbery | `instanceId`, from, to, `robberyId` |
| `POOL_CREDIT` / `POOL_DEBIT` | Any change to `houseMarginAccrued` or `jackpotPoolAccrued` | pool name, amount, resulting balance |

Every faucet and sink in `economy-closed-loop.md` sections 3 and 4 maps to a `WALLET_CREDIT` or
`WALLET_DEBIT` carrying that faucet or sink ID. This is what makes invariant I5 testable from the
log: sum the credits by faucet, sum the debits by sink, and the difference is circulating
currency. Robbery legs carry the `ROBBERY` reason and net to zero, which is why I5 must stay
green across any number of robberies.

There is no `WALLET_TRANSFER` type. A transfer is two legs sharing a `groupId`, so the log has no
shape that could represent a value movement between accounts without both legs being visible.

### 3.2 Casino rounds and the jackpot

| Type | When | Key payload |
| --- | --- | --- |
| `ROUND_OPENED` | A table or machine round begins | `roundId`, game, seats |
| `ROUND_STAKED` | Stake accepted | `roundId`, player, amount |
| `ROUND_RESOLVED` | Outcome drawn server-side | `roundId`, outcome, RNG draw identifier |
| `ROUND_SETTLED` | Payouts and margin applied | `roundId`, per-seat delta, margin to `houseMarginAccrued` |
| `JACKPOT_CONTRIBUTION` | A share of a wager routed to the pool | amount, `jackpotContributionBps` in force, resulting pool |
| `JACKPOT_HIT` | The `JACKPOT` outcome drawn | `roundId`, pool balance at draw, amount paid, reset seed |
| `JACKPOT_POOL_RESET` | Pool set to `jackpotSeed` after a hit or at first start | previous balance, seed, cause |

`JACKPOT_CONTRIBUTION`, `JACKPOT_HIT`, and `JACKPOT_POOL_RESET` together are what make the pool
reconstructable: start at the seed, apply contributions, subtract hits, and the result must equal
the stored `jackpotPoolAccrued` exactly. That reconciliation is assertion-grade, not a nicety;
`casino-games-mvp.md` 6.4 requires it and G15 (two concurrent hits cannot both be paid the same
pool) is most easily caught by it.

`ROUND_RESOLVED` records an identifier for the RNG draw, not the RNG state. Logging enough to
reproduce future draws would create the very predictability G1 forbids.

### 3.3 Robbery

Robbery is the one system where **every state transition** is logged, not just the outcome. RB14
requires it and the reason is that a robbery is an involuntary transfer between two players: the
question "was this legitimate" must be answerable from the log without re-running the game.

| Type | When | Key payload |
| --- | --- | --- |
| `ROBBERY_INITIATED` | Preconditions passed, state `INITIATED` | `robberyId`, aggressor, victim, zone class, distance |
| `ROBBERY_REFUSED` | Preconditions failed | `robberyId`, refusal cause from a closed set |
| `ROBBERY_CONTESTED` | Entered `CONTESTED` | `robberyId`, window duration |
| `ROBBERY_RESOLVED` | `SUBDUED`, `ESCAPED`, or `ABORTED` | `robberyId`, resolution, escape mechanism if any |
| `ROBBERY_SETTLED` | The transfer applied | `robberyId`, amount, share and cap in force, contraband instances |
| `ROBBERY_AFTERMATH` | Heat and immunity applied | `robberyId`, heat delta, immunity expiry |

Refusal causes are enumerated so that RB2, RB13, and RB15 are each observable as a distinct
logged reason: victim in a `SAFE` zone, aggressor in a `SAFE` zone, victim immune, out of range,
line of sight broken, aggressor on a casino shift, robbery target carries no eligible value, or
robbery config is invalid.

Logging refusals matters more than it looks. A robbery system that silently drops invalid
attempts is indistinguishable in the log from one whose zone volumes are authored wrong, and
zone authoring is exactly the kind of thing that will be wrong at least once.

`ROBBERY_SETTLED` records the share and cap **in force at settlement**, not just the amount. When
The configured robbery defaults and later developer retunes are recorded with each settlement,
so the log still explains why an old robbery took what it took.

### 3.4 Heat, police, and access

| Type | When | Key payload |
| --- | --- | --- |
| `HEAT_APPLIED` | Any increase | delta, resulting value, tier before and after, cause from a closed set |
| `HEAT_DECAYED` | Any decrease from time, including offline decay at hydration | delta, resulting value, elapsed period |
| `HEAT_CLEARED` | Fine paid, bribe, or other clear path | path, amount, resulting value |
| `PURSUIT_STARTED` / `PURSUIT_ENDED` | NPC pursuit lifecycle | cause, resolution |
| `ARREST` | Booking | fine amount, debt recorded, contraband destroyed |
| `INTERLOCK_REFUSED` | Door, cage, employment, or ownership check refused | interlock, tier, requirement |

`HEAT_APPLIED` causes are the closed set in `police-and-heat.md` section 3, extended by the three
robbery rows added there. H1 says heat is only mutated by server-observed events; the closed
cause set is how that is enforced in practice, because there is no cause value meaning "the
client said so".

`INTERLOCK_REFUSED` exists so that H6 and T23 are testable from the log. An interlock enforced by
hiding UI produces no event; an interlock enforced server-side produces one every time.

### 3.5 Progression, employment, and session

| Type | When | Key payload |
| --- | --- | --- |
| `QUEST_STAGE_COMPLETED` | A `Q0`-`Q5` stage transition | stage, rewards granted, `groupId` |
| `EMPLOYMENT_CHANGED` | Role granted, forfeited, or rotated | from, to, cause |
| `SEAT_CONTENTION` | Two players qualify for one seat | winner, `SUCCESSOR` queue result |
| `JOB_STARTED` / `JOB_COMPLETED` / `JOB_ABANDONED` | Job lifecycle | `jobInstanceId`, job ID, payout if any |
| `SESSION_STARTED` / `SESSION_ENDED` | Login, logout, disconnect | cause, whether anything in flight was resolved |
| `MIGRATION_APPLIED` | A schema migration ran | from version, to version |
| `SERVER_REFUSED_START` | A fail-closed refusal at startup | which parameter or version was the cause |

`SESSION_ENDED` naming what was resolved in flight is what makes the reconnect assertions
readable: RB9, RB10, G4, and H4 all resolve something at disconnect, and a log that only records
"player left" cannot show which rule fired.

## 4. Ordering, durability, and immutability

| Property | Rule |
| --- | --- |
| Ordering | `sequence` is monotonic and gapless per store; a gap means loss and is an error, not a warning |
| Append-only | No event is ever updated or deleted. A mistake is corrected by a compensating event, never by editing history |
| Durability | An event is durable before the mutation it describes is acknowledged (`local-profile-persistence-adapter.md` PA8) |
| Grouping | Every leg of a transaction group is appended in one atomic append; a partially appended group is impossible |
| Clock | `occurredAtUtc` is the server clock; a client timestamp never enters the log |
| Retention | Retained for the life of the store in Phase 1. No pruning, no rotation by size |

Append-only with compensating events is a real constraint, not a formality. The correction path
being visible is what lets an auditor tell an operator fixing a bug apart from an operator
hiding one, and it is the reason the log can serve as ticket evidence at all.

## 5. What must never appear in the log

- Client-supplied values presented as facts. If a client message is logged at all, it is logged
  as a received message with a cause of `CLIENT_REQUEST`, never as a decision.
- Anything that would let a client predict an outcome: RNG state, seeds, shoe order, or hole
  cards before reveal (G1, G8).
- Real-money amounts, payment identifiers, or purchase references. There are none in this game
  and a field that could hold one invites its use (economy constraint C1).
- Credentials, tokens, or session secrets.
- Floating-point money. Money is integer minor units everywhere (PA1).

## 6. Reconstruction procedure

The log's central claim is that state is derivable from it. The procedure is specified so the
claim is testable rather than asserted.

1. Start from the empty store plus `jackpotSeed` and the configured parameters.
2. Replay events in `sequence` order, applying only money, pool, item, meter, role, and quest
   effects.
3. Compare the reconstructed values against the stored records: every wallet container, both
   pools, `outstandingDebt`, `heat`, `standing`, every item instance and its `bound` flag, every
   role seat, and every quest stage.
4. Any divergence is a defect in the writer, not in the replay. The stored record is not the
   authority in this comparison; the log is, because the log is what durably preceded each
   acknowledgement.

Step 4 is the ordering that matters. If a divergence is resolved by trusting the record, the log
stops being evidence and becomes decoration.

## 7. Out of scope

- Streaming, subscription, or push delivery of events to any consumer.
- Analytics pipelines, dashboards, warehouses, or aggregation jobs.
- A player-facing transaction history UI.
- Cross-server or multi-host log aggregation. One server, one store (PA13).
- Log compaction, snapshotting, or archival tiers. Ten players do not generate the volume.
- Any external export path. Nothing leaves the host in Phase 1.

## 8. Invariants for implementation and test

| ID | Invariant |
| --- | --- |
| EL1 | `sequence` is monotonic and gapless per store; a gap is an error |
| EL2 | No event is ever updated or deleted; corrections are compensating events |
| EL3 | Every event is durable before the mutation it describes is acknowledged |
| EL4 | Every leg of a transaction group shares one `groupId` and is appended atomically |
| EL5 | Every money-moving event names a faucet ID, a sink ID, `ROBBERY`, or `CAGE`; there is no unattributed money movement |
| EL6 | There is no event type representing a value transfer between accounts as a single leg |
| EL7 | Every `HEAT_APPLIED` and `HEAT_DECAYED` names a cause from the closed set; no cause means "client reported" |
| EL8 | Every robbery state transition and every refusal is logged, with refusal causes from a closed set |
| EL9 | `ROBBERY_SETTLED` records the share and cap in force at settlement |
| EL10 | `jackpotPoolAccrued` replayed from `jackpotSeed` over all contribution, hit, and reset events equals the stored balance exactly |
| EL11 | Every wallet container replayed from the log equals the stored balance exactly |
| EL12 | No RNG state, seed, shoe order, or pre-reveal hole card appears in any event |
| EL13 | No client-supplied value is logged as a decision; client input is logged only as a received request |
| EL14 | All money amounts in the log are integer minor units |
| EL15 | `occurredAtUtc` is always a server clock value |
| EL16 | Every server-side interlock refusal writes an `INTERLOCK_REFUSED` event |
| EL17 | A fail-closed startup refusal writes `SERVER_REFUSED_START` naming the missing/invalid parameter or version |

EL10 and EL11 are the two assertions that prove the log is complete rather than merely present.
EL5 and EL6 are the two that keep the economy auditable. EL8 is the one that makes an
involuntary transfer defensible. If a test budget forces a choice, those five come first.

## 9. Open Owner decisions

None originate here. The log records D7 and any later balance tuning, and section 3.3 is written
so that a later change to those values remains explicable from old entries. Decisions are recorded in
`projects/game-design/documents/open-owner-decisions.md`.
