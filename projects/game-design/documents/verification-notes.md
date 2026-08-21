# Verification notes - game design surface

- Status: Draft for Owner review
- Surface: Game design
- Ticket: `management/backlog/0001-casino-world-mvp-foundation.md`;
  Phase 1 revision under `management/backlog/0003-phase1-rules-and-local-backend-contract.md`

Two parts: what the documentation tasks actually verified, and the verification
obligations these documents impose on later phases. The PM playbook forbids closing a ticket on
an agent claim, so the second part is written as testable assertions with owners.

Assertion IDs are permanent. T1-T28 were established in Phase 0; T29-T78 were added by the
Phase 1 rules revision and cover robbery, the jackpot machine, the persistence adapter, the
event log, and the ten-player Windows target.

## Part 1 - what was verified in this task

This was a documentation task. No engine or service code exists in the repository yet, so there
was no build to run and no test suite to execute.

| Check | Method | Result |
| --- | --- | --- |
| Slots RTP, house edge, hit frequency | Exhaustive enumeration of all 8000 reel combinations | RTP 94.825%, edge 5.175%, hit 14.35%; matches the paytable in `casino-games-mvp.md` 3.2 |
| Slots combination counts | Same enumeration, per-symbol breakdown | SEVEN 1, BAR3 8, BAR2 27, BELL 64, CHERRY 64, LEMON 216, exactly-2-CHERRY 768; total 1148 winning combinations |
| Roulette uniform edge | Closed-form check of all 7 bet types | Every bet type returns exactly 36/37 = 97.2973%, edge 2.7027% |
| Cross-document consistency | Manual read-through of all 8 documents | Faucet/sink IDs, role names, heat tiers, and quest stage IDs are consistent across documents |
| Scope fence | Compared `gdd-casino-world-mvp.md` 7 against ticket 0001 Scope and Out of scope | No contradiction; MVP fence is a subset of the ticket's approved scope |

Reproducing the slots and roulette checks (both are pure arithmetic, no repo dependency):

```bash
python3 - <<'PY'
from itertools import product
strip = ['SEVEN']+['BAR3']*2+['BAR2']*3+['BELL']*4+['CHERRY']*4+['LEMON']*6
pay3 = {'SEVEN':1500,'BAR3':250,'BAR2':50,'BELL':12,'CHERRY':12,'LEMON':2}
total = ret = wins = 0
for c in product(strip, repeat=3):
    total += 1
    p = pay3[c[0]] if c[0]==c[1]==c[2] else (1 if sum(s=='CHERRY' for s in c)==2 else 0)
    if p: wins += 1; ret += p
print(f"combos={total} winning={wins} RTP={100*ret/total:.4f}% edge={100-100*ret/total:.4f}%")
for n,m in [(1,35),(2,17),(3,11),(4,8),(6,5),(12,2),(18,1)]:
    print(f"roulette n={n:2d} pays {m}:1 -> return {n*(m+1)/37:.6f}")
PY
```

Expected output: `combos=8000 winning=1148 RTP=94.8250% edge=5.1750%`, then seven roulette
lines all showing `return 0.972973`.

Files created by the Phase 0 task, all inside the assigned surface fence:

- `projects/game-design/documents/gdd-casino-world-mvp.md`
- `projects/game-design/documents/economy-closed-loop.md`
- `projects/game-design/documents/jobs-and-employment.md`
- `projects/game-design/documents/casino-games-mvp.md`
- `projects/game-design/documents/shop-and-cosmetics.md`
- `projects/game-design/documents/hidden-quest-back-room.md`
- `projects/game-design/documents/police-and-heat.md`
- `projects/game-design/documents/open-owner-decisions.md`
- `projects/game-design/documents/verification-notes.md`

No file outside `projects/game-design/documents/` was modified by the design work. No engine
code was written, consistent with the ticket's scope fence.

### 1.1 Phase 1 rules revision - what was verified

The Phase 1 revision changed rules rather than numbers: Windows-only, ten concurrent players, a
fourth casino game, no **voluntary** player trading, and robbery outside the casino safe zone
with automatic PvP. It also added the two backend contract documents. Again no engine or service
code exists, so there was no build and no test suite.

| Check | Method | Result |
| --- | --- | --- |
| Faucet and sink lists still closed | Compared `economy-closed-loop.md` 3 and 4 against every new value movement | Robbery is a redistribution (6.2) and the jackpot pool is a deferred sink payout (6.3); F1-F5 and S1-S7 are unchanged |
| Robbery cannot mint currency | Traced the settlement legs in `robbery-and-pvp.md` 5 against invariant I5 | Zero-sum by construction: equal legs under one `robberyId`, so circulating `CASH` is invariant across a settled robbery |
| Working values are server-only and versioned | Scanned every parameter table added in Phase 1 | Robbery defaults and jackpot zone/tier defaults are documented; missing, invalid, or client-editable config fails closed |
| PROTECTED classification is exhaustive | Cross-read `robbery-and-pvp.md` 3.2 against every grant path in the shop, quest, job, and starter documents | Every grant path sets `BOUND`; no grant path produces a `LOOTABLE` durable item |
| Safe-zone consistency | Compared `gdd-casino-world-mvp.md` 4 zone table against `robbery-and-pvp.md` 2 | Consistent, with `robbery-and-pvp.md` named normative on conflict; police pursuit explicitly decoupled from PvP `SAFE` (H11) |
| Invariant ID uniqueness | Enumerated every invariant table across both surfaces | C1-C5, F1-F5, S1-S7, I1-I14, G1-G17, SH1-SH7, HQ1-HQ11, H1-H11, RB1-RB16, PA1-PA20, EL1-EL17; no duplicate ID, no gap |
| Cross-reference integrity | Checked every invariant ID cited by an assertion below | Every cited ID exists in the document it is attributed to |
| Scope fence | Compared changed files against ticket 0003's fence | Only `projects/game-design/documents/`, `projects/backend/documents/`, and one proposed decision record were touched |

Files added or changed by the Phase 1 revision:

- `projects/game-design/documents/robbery-and-pvp.md` (new)
- `projects/game-design/documents/gdd-casino-world-mvp.md`, `economy-closed-loop.md`,
  `casino-games-mvp.md`, `police-and-heat.md`, `jobs-and-employment.md`,
  `shop-and-cosmetics.md`, `hidden-quest-back-room.md`, `open-owner-decisions.md`,
  `README.md`, `verification-notes.md`
- `projects/backend/documents/local-profile-persistence-adapter.md` (new)
- `projects/backend/documents/authoritative-event-log.md` (new)
- `projects/backend/documents/README.md`
- `management/decisions/0003-phase1-rules-revision.md` (new, proposed)

What this task could **not** verify, and why it is not a gap that can be closed by more reading:
the final post-MVP robbery balance and jackpot tuning are still open, so production loss/RTP
sign-off remains pending. Phase 1 has working defaults and requires enumeration before enablement.

## Part 2 - verification obligations for later phases

### 2.1 Cheap deterministic tests (write these first)

These need no engine, no server, and no network. They are the highest value per minute of work
in the whole plan and should exist before the first casino table is playable.

| ID | Assertion | Invariant |
| --- | --- | --- |
| T1 | Slots RTP over 10,000,000 simulated spins is 94.825% +/- 0.05pp | G5 |
| T2 | Every roulette bet type returns exactly 36/37 under full coverage | G6 |
| T3 | No slot or roulette payout produces a fractional chip | G10 |
| T4 | Blackjack S17 dealer logic is deterministic for all reachable dealer hands | G7 |
| T5 | Faucet total minus sink total equals circulating currency over a simulated 1000-transaction run | I5 |

### 2.2 Transaction and idempotency tests

| ID | Assertion | Invariant |
| --- | --- | --- |
| T6 | Replaying any mutation with the same idempotency key is a no-op returning the first result | I4 |
| T7 | Wallet balances never go negative and are always integers | I2 |
| T8 | A round's stake debit and payout credit share one `roundId` | G2, G3 |
| T9 | Shop purchase debit and cosmetic grant succeed or fail atomically | SH1 |
| T10 | Buying an owned item is rejected without charging | SH2 |
| T11 | Owner draw never exceeds `houseMarginAccrued` | I8 |
| T12 | No API exists that transfers value between two player accounts | I9, C2 |
| T13 | Q5 buyout debits 250,000 `CASH` and credits no wallet or pool | HQ6, S7 |

### 2.3 Multiplayer and reconnect tests (one server, ten clients)

| ID | Assertion | Invariant |
| --- | --- | --- |
| T14 | Disconnect mid-round settles server-side: stake neither refunded nor double-paid | I7, G4 |
| T15 | Disconnect during police pursuit resolves as arrest after the grace window | H4 |
| T16 | Job payout credits exactly once across a disconnect/reconnect during the job | `jobs-and-employment.md` 1 |
| T17 | Two players completing Q5 concurrently produce exactly one `OWNER` | HQ5 |
| T18 | Heat, outstanding debt, and pursuit state survive reconnect | H3 |
| T19 | Four concurrent players at one roulette table settle in a single transaction group | G2 |

### 2.4 Security-shaped tests

These test that the client cannot lie. They are the tests most likely to be skipped and most
expensive to skip.

| ID | Assertion | Invariant |
| --- | --- | --- |
| T20 | A crafted client message cannot increase any wallet balance | I1 |
| T21 | A player-dealer's client never receives the hole card before reveal | G8 |
| T22 | A dealer's wager at their own table is rejected server-side, not merely hidden in UI | `jobs-and-employment.md` 4 |
| T23 | Casino door, cage, shop, and employment interlocks are enforced server-side | H6 |
| T24 | Heat can only be mutated by server-observed events, never by client report | H1 |
| T25 | The staff door's per-player openable state cannot be forced by a client flag | HQ9 |
| T26 | Outcome RNG is not derivable from client-observable data | G1 |
| T27 | Insignia items cannot be obtained through the purchase path at any price | SH5, HQ8 |
| T28 | No cosmetic record carries a gameplay stat field, and equipping changes no simulation value | SH3, SH4 |

T21 and T26 are the two genuine cheating vectors in the design. Everything else on this list is
defence in depth.

Note on T12: its wording predates the Phase 1 amendment of economy constraint C2. It now asserts
that no **voluntary** transfer API exists; the involuntary robbery path is asserted separately by
T43.

### 2.5 Robbery and PvP tests

The five that matter most are T31, T34, T35, T32, and T33: the first three keep the economy
closed and the last two keep a robbery from becoming a permanent loss of progress.

| ID | Assertion | Invariant |
| --- | --- | --- |
| T29 | A robbery initiated while either party is inside a `SAFE` volume is rejected server-side and logged as a refusal | RB2, EL8 |
| T30 | Zone hostility is resolved from server volumes only; a crafted client zone claim changes nothing | RB1, I1 |
| T31 | A value not explicitly marked `LOOTABLE` never appears in a loot window; a newly added value type defaults to `PROTECTED` | RB3 |
| T32 | No `BOUND` item can be transferred, destroyed, or shown in a loot window | RB4, HQ10, SH7 |
| T33 | Banked `CASH`, `CHIPS`, cosmetics, Insignia, starter loadout, quest items, and active-job items are unchanged across a robbery | RB5, I12, HQ11 |
| T34 | Victim debit and aggressor credit are equal in magnitude and share one `robberyId` | RB6 |
| T35 | Circulating `CASH` is unchanged across an arbitrary number of settled robberies; the T5 faucet/sink test stays green | RB7, I5 |
| T36 | Replaying a settlement with the same `robberyId` mutates nothing and returns the stored result | RB8, I4 |
| T37 | Disconnect by either party during `CONTESTED` resolves server-side and leaves no value in limbo | RB9 |
| T38 | Disconnect by the victim after `RESOLVED_SUBDUED` still settles; logging off is not an escape | RB10 |
| T39 | The transfer clamps to the victim's carried balance and no wallet goes negative | RB11, I2 |
| T40 | Spawn protection is the only robbery immunity; no post-robbery immunity or gameplay cooldown exists | RB12 |
| T41 | The server rejects robbery when its versioned config is missing, invalid, or client-editable | RB13, I14, PA19 |
| T42 | A player on any casino employment shift cannot initiate a robbery | RB15, H6 |
| T43 | The only transfer path between accounts is the full robbery state machine; no endpoint accepts a voluntary transfer | RB16, I9, C2 |

### 2.6 Jackpot machine tests

| ID | Assertion | Invariant |
| --- | --- | --- |
| T44 | The jackpot machine rejects a wager when its versioned zone/tier config is missing, invalid, or client-editable | G12, I14 |
| T45 | A jackpot payout equals the pool balance at draw time, debits the pool by exactly that amount, and resets it to `jackpotSeed` | G13, I13 |
| T46 | `jackpotPoolAccrued` never goes negative and is credited only by that machine's own margin | G14 |
| T47 | Two concurrent jackpot hits cannot both be paid the same pool | G15 |
| T48 | Enumerated total RTP including the pool contribution is strictly below 100%, derived by exhaustive enumeration rather than asserted | G16 |
| T49 | The replicated pool counter is display-only; no payout reads a client-supplied pool value | G17, I1 |
| T50 | The pool replayed from `jackpotSeed` over all contribution, hit, and reset events equals the stored balance exactly | EL10 |
| T51 | A disconnect mid-spin settles server-side with no refund and no double payout | G4 |

T44 and T48 run against the working developer configuration and must fail closed for invalid
variants. T45 through T47, T50, and T51 are writable now, and T47 should exist before the first
cabinet is playable because a double-paid pool is nearly invisible in play.

### 2.7 Persistence adapter tests

These are owned by the backend surface and specified in
`projects/backend/documents/local-profile-persistence-adapter.md`. They need no engine, no
network, and no client, which makes them the cheapest tests in Phase 1.

| ID | Assertion | Invariant |
| --- | --- | --- |
| T52 | Every money field is an integer in minor units; no floating-point money exists in the record, the file format, or the interface | PA1 |
| T53 | No wallet field is negative at rest or mid-transaction | PA2, I2 |
| T54 | Every mutating call requires a caller-supplied idempotency key derived from a game event | PA3, I3 |
| T55 | Replaying a seen key mutates nothing and returns the stored result of the first application | PA4, I4 |
| T56 | A key reused for a genuinely different operation returns an error, never the prior result | PA5 |
| T57 | A transaction group applies in full or not at all across every profile and server-record leg | PA6, SH1 |
| T58 | A process killed mid-group leaves the store fully applied or fully unapplied after restart | PA7 |
| T59 | The adapter refuses to start against a store whose `schemaVersion` is higher than it understands | PA9 |
| T60 | Migrations are forward-only, ordered, idempotent, re-runnable after interruption, and preceded by a backup | PA10 |
| T61 | An unknown field written by a newer build survives a load and save cycle | PA11 |
| T62 | A second server process refuses to start against a locked store | PA13 |
| T63 | `LoadProfile` returns a whole record; there is no partial or lazy hydration | PA14 |
| T64 | Both pools are never negative and never modelled as wallets; at most one `OWNER` and one `FLOOR_MANAGER` exist | PA15, PA16, HQ5 |
| T65 | No operation transfers value between two `playerId` values as a primitive, and the public interface exposes no file path, SQL string, connection, or transport type | PA17, PA18 |

T58, T59, and T60 are the data-integrity three. They are the tests most likely to be deferred as
"infrastructure" and the only ones whose absence is discovered by losing a player's profile.

### 2.8 Event log tests

Specified in `projects/backend/documents/authoritative-event-log.md`.

| ID | Assertion | Invariant |
| --- | --- | --- |
| T66 | `sequence` is monotonic and gapless; an injected gap is reported as an error, not a warning | EL1 |
| T67 | No event can be updated or deleted; a correction appends a compensating event | EL2 |
| T68 | An event is durable before the mutation it describes is acknowledged to the caller | EL3, PA8 |
| T69 | Every leg of a transaction group shares one `groupId` and is appended atomically | EL4 |
| T70 | Every money-moving event names a faucet ID, a sink ID, `ROBBERY`, or `CAGE`; no unattributed money movement exists | EL5, EL6 |
| T71 | Every heat mutation names a cause from the closed set, and no cause value means "the client reported it" | EL7, H8, H1 |
| T72 | Every robbery state transition and every refusal is logged, with refusal causes from the closed set | EL8, EL9, RB14 |
| T73 | Every wallet container replayed from the log equals the stored balance exactly | EL11 |
| T74 | No RNG state, seed, shoe order, or pre-reveal hole card appears in any event, and no client-supplied value is logged as a decision | EL12, EL13, G1, G8 |

T73 and T50 together are the pair that prove the log is complete rather than merely present. A
log that cannot reproduce the balances is a log nobody will trust as ticket evidence.

### 2.9 Scale and platform checks (ten clients, Windows only)

| ID | Assertion | Invariant |
| --- | --- | --- |
| T75 | Ten concurrent players on one Windows dedicated server complete a session including a reconnect, with no duplicated reward | D23, I4 |
| T76 | Ten players contending for shared job stations produce no double payout and no orphaned `jobInstanceId` | `jobs-and-employment.md` 1 |
| T77 | Several simultaneous robbery interactions settle in separate transaction groups with no cross-contamination of legs | RB6, PA6 |
| T78 | Only the Windows client and Windows dedicated server targets are exercised; no Linux, console, or cloud path is required to run the MVP | D24 |

T76 and T77 are the two things ten players raise that four did not, and they are named in the
`gdd-casino-world-mvp.md` section 5 scale note for that reason.

### 2.10 Observed-behaviour checks (cannot be automated)

Per the playbook's evidence bar, gameplay and UI changes need observed in-engine behaviour:

- Third-person to seated first-person camera transition on taking a table seat.
- A full Q0 to Q5 playthrough demonstrating the job -> casino -> quest -> ownership loop named
  in ticket 0001's acceptance criteria.
- A player-dealt blackjack round with a real player in the dealer position.
- A police pursuit from tier 3 detection through arrest, fine, and release.
- Casino door refusal at tier 3, then admission after paying the fine.
- A robbery from initiation through subdual, loot window, and settlement, with the victim's
  banked cash, chips, cosmetics, and quest items visibly untouched afterwards.
- A victim escaping into the casino from `CONTESTED`, demonstrating that the `SAFE` boundary
  ends the attempt.
- A robber at tier 3 heat refused at the casino door while carrying stolen cash, which is the
  observable form of the self-limiting argument in `robbery-and-pvp.md` section 7.
- A jackpot hit paying the visible pool, followed by the counter resetting to the seed.

### 2.11 Balance measurements (not pass/fail, but must be recorded)

- Realised blackjack house edge across actual play, versus the ~0.55% basic-strategy figure.
- Actual `CASH` per hour for each job path, versus the 900-1300 target.
- Time to reach Q1 for a naive player, versus the 1-2 hour estimate.
- Net currency in circulation over a multi-session test, to confirm the downward trend
  predicted in `economy-closed-loop.md` section 5.
- Robbery frequency per player-hour at ten concurrent players, and the share of carried `CASH`
  actually banked, which together say whether banking is a real decision or a formality.
- Replication cost on the casino floor with ten players present, named as a scale risk in
  `gdd-casino-world-mvp.md` section 5.

## Part 3 - what this surface cannot verify

The design surface cannot verify server authority, replication, persistence, or idempotency by
reading its own documents. Every invariant in Part 2 is an assertion *about* code that does not
exist yet. Whoever implements each system owns proving it, and per the playbook the PM checks
the diff independently. This document is the checklist, not the evidence.

Two Phase 1 additions sharpen that boundary. The persistence and event-log assertions (T52-T74)
are owned by the backend surface, not this one, and are listed here only because this document is
the project's single assertion index. T44 and T48 run against the working developer-owned jackpot
config and must be rerun whenever that config changes.

## Part 4 - unresolved Owner gates

Every gate open at the time of writing, and what it blocks in this checklist. Full text and
recommendations are in `open-owner-decisions.md`.

| Gate | Unresolved question | Blocks |
| --- | --- | --- |
| D16 | External service contract beyond Phase 1 | Adapter replacement mapping remains a later backend gate |
| D17 | Robbery carried-cash share and per-robbery cap | Resolved for Phase 1 as 100% carried cash and no cap; post-MVP balance review remains |
| D18 | Per-aggressor robbery cooldown | Resolved for Phase 1 as 0; transport anti-spam is technical only |
| D19 | Non-lethal subdual versus lethal PvP combat | The robbery flow's shape; T29-T43 assume non-lethal |
| D20 | Whether a `CASH.carried` cap should exist | Balance only; blocks no assertion |
| D21 | Amend economy constraint C2 to "no **voluntary** transfer" | Resolved; T43 guards the rule |
| D22 | Jackpot outcome space, paytable, hit odds, contribution share, seed, fixed stake | Working zone/tier defaults are resolved for Phase 1; post-MVP balance tuning remains |
| D23 | Confirm ten concurrent players | Resolved; T75-T77 |
| D24 | Confirm Windows-only | Resolved; T78 |
| D25 | Confirm the local Phase 1 persistence adapter | Resolved; T52-T74 |
| D7 | Offline heat decay rate | The hydration branch of T18 and the decay half of T71 |
| D2, D3, D4, D5, D8-D15 | Phase 0 balance and content questions | Phase 4 balance measurements in section 2.11 |

Final balance sign-off for D17/D22 remains a later product review, but Phase 1 has explicit
working defaults and validation. A missing, invalid, or client-editable config produces a
refusal to enable the affected system, never a silently wrong number.
