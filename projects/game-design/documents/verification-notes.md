# Verification notes - game design surface

- Status: Draft for Owner review
- Surface: Game design
- Ticket: `management/backlog/0001-casino-world-mvp-foundation.md`

Two parts: what this Phase 0 documentation task actually verified, and the verification
obligations these documents impose on later phases. The PM playbook forbids closing a ticket on
an agent claim, so the second part is written as testable assertions with owners.

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

Files created by this task, all inside the assigned surface fence:

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

### 2.3 Multiplayer and reconnect tests (one server, four clients)

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

### 2.5 Observed-behaviour checks (cannot be automated)

Per the playbook's evidence bar, gameplay and UI changes need observed in-engine behaviour:

- Third-person to seated first-person camera transition on taking a table seat.
- A full Q0 to Q5 playthrough demonstrating the job -> casino -> quest -> ownership loop named
  in ticket 0001's acceptance criteria.
- A player-dealt blackjack round with a real player in the dealer position.
- A police pursuit from tier 3 detection through arrest, fine, and release.
- Casino door refusal at tier 3, then admission after paying the fine.

### 2.6 Balance measurements (not pass/fail, but must be recorded)

- Realised blackjack house edge across actual play, versus the ~0.55% basic-strategy figure.
- Actual `CASH` per hour for each job path, versus the 900-1300 target.
- Time to reach Q1 for a naive player, versus the 1-2 hour estimate.
- Net currency in circulation over a multi-session test, to confirm the downward trend
  predicted in `economy-closed-loop.md` section 5.

## Part 3 - what this surface cannot verify

The design surface cannot verify server authority, replication, persistence, or idempotency by
reading its own documents. Every invariant in Part 2 is an assertion *about* code that does not
exist yet. Whoever implements each system owns proving it, and per the playbook the PM checks
the diff independently. This document is the checklist, not the evidence.
