# Casino mini-games - MVP set

- Status: Draft for Owner review
- Surface: Game design
- Ticket: `management/backlog/0001-casino-world-mvp-foundation.md`

Three games ship in the MVP: slots, roulette, and blackjack. Together they cover the three
play tempos (solo/instant, group/fast, group/deliberate) with one implementation each.

## 1. Rules that apply to every game

- **Stake is `CHIPS` only.** No `CASH` at the table. The cage is the only conversion point.
- **The server owns the RNG and the outcome.** The client sends a bet intent and receives a
  settled result plus enough data to animate it. The client never generates an outcome and
  never decides a payout.
- **RNG must be a CSPRNG**, seeded server-side, never derived from client input, tick count,
  or anything a player can observe or influence.
- **Outcome before animation.** The result is computed and ledgered at round settlement; the
  animation is presentation replay. This means a mid-animation disconnect cannot change money.
- **Every round writes one transaction group**: stake debit, then payout credit if any, sharing
  a `roundId` idempotency key.
- **A round settles even if a player leaves.** Stake is not refunded and not double-paid
  (economy invariant I7).
- **Table limits:** minimum 10 `CHIPS`, maximum 2500 `CHIPS` per bet position in the MVP.
  A `FLOOR_MANAGER` may raise the minimum within an Owner-approved band but can never
  change a paytable or house edge.

## 2. Round phase model (shared state machine)

```text
IDLE -> BETTING (open, timed) -> LOCKED (no new bets) -> RESOLVING -> PAYOUT -> IDLE
```

| Phase | Slots | Roulette | Blackjack |
| --- | --- | --- | --- |
| BETTING window | player-paced | 20 s | 15 s |
| Player decisions during round | none | none | hit/stand/double/split, 12 s per decision |
| Typical round length | 4 s | 45 s | 60 to 120 s |

Timeouts are server-enforced. A blackjack decision timeout auto-stands. A betting timeout
means no bet placed, not a forced bet.

## 3. Slots

Three mechanical reels, one centre payline, one bet per spin. Solo play, four machines.

### 3.1 Reel strip

All three reels use the same 20-stop virtual strip:

| Symbol | Stops per reel |
| --- | --- |
| SEVEN | 1 |
| BAR3 | 2 |
| BAR2 | 3 |
| BELL | 4 |
| CHERRY | 4 |
| LEMON | 6 |
| **Total** | **20** |

Total outcome space is 20 x 20 x 20 = **8000** equally likely combinations. Stops are
uniform, so the displayed reel and the mathematical reel are the same object. There is no
weighted "near-miss" manipulation.

### 3.2 Paytable and RTP derivation

| Win | Combinations | Pays (x bet) | Return contribution |
| --- | --- | --- | --- |
| SEVEN x3 | 1 | 1500 | 1500 |
| BAR3 x3 | 8 | 250 | 2000 |
| BAR2 x3 | 27 | 50 | 1350 |
| BELL x3 | 64 | 12 | 768 |
| CHERRY x3 | 64 | 12 | 768 |
| LEMON x3 | 216 | 2 | 432 |
| Exactly 2 CHERRY | 768 | 1 | 768 |
| **Total** | **1148** | | **7586** |

Combination counts: three-of-a-kind is `stops^3`. "Exactly 2 CHERRY" is
`3 x 4 x 4 x 16 = 768`, where 16 is the non-cherry stop count; it excludes the 3-cherry case,
so nothing is double counted.

- **RTP = 7586 / 8000 = 94.825%**
- **House edge = 5.175%**
- **Hit frequency = 1148 / 8000 = 14.35%**

Verified by exhaustive enumeration of all 8000 combinations on 2026-08-21; see
`verification-notes.md` for the check that reproduces these figures.

This is inside the 5.0% +/- 0.5pp target band from `economy-closed-loop.md`. Owner decision
D2 covers whether 5% is the right target.

### 3.3 Notes

- Payouts are integer multiples of the bet, so no rounding rule is needed and no fractional
  chip can exist.
- The 1500x top prize on a 2500 chip max bet implies a 3.75M chip exposure. The MVP caps the
  slot maximum bet at **100 `CHIPS`** for this reason, giving a 150k worst case that the house
  margin pool can absorb.

## 4. Roulette

Single-zero European wheel: 37 pockets (0, 1-36). Multi-player, shared table, up to 4 seats
plus standing bets.

### 4.1 Bets and payouts

| Bet | Covers | Pays | Return | Edge |
| --- | --- | --- | --- | --- |
| Straight up | 1 number | 35:1 | 36/37 | 2.70% |
| Split | 2 numbers | 17:1 | 36/37 | 2.70% |
| Street | 3 numbers | 11:1 | 36/37 | 2.70% |
| Corner | 4 numbers | 8:1 | 36/37 | 2.70% |
| Line | 6 numbers | 5:1 | 36/37 | 2.70% |
| Dozen / Column | 12 numbers | 2:1 | 36/37 | 2.70% |
| Red/Black, Odd/Even, High/Low | 18 numbers | 1:1 | 36/37 | 2.70% |

Every bet returns `(n x payout_multiple + n) / 37 = 36/37` where `n` is numbers covered, so
**RTP is a uniform 97.30% and the house edge is a uniform 2.70%** (`1/37`). There is no
"good bet" or "bad bet"; the wheel is honest and uniformly negative.

Deliberately excluded: the American double-zero wheel (5.26% edge, worse for players and
worse for the game's tone) and the `en prison` / `la partage` even-money rules (they halve the
edge on outside bets and break the uniformity above, which makes the sink harder to reason about).

### 4.2 Implementation notes

- The winning pocket is drawn as one uniform integer in `[0, 36]` at `RESOLVING`. The wheel
  and ball animation is derived from that number, not the reverse.
- All seats' bets settle in one transaction group against `roundId`.
- Player-vs-player is irrelevant here: each seat plays only against the house, so a full
  table and an empty table have identical odds.

## 5. Blackjack

6-deck shoe, up to 4 player seats, one dealer position (NPC or a player with the `DEALER`
role).

### 5.1 House rules

| Rule | Setting |
| --- | --- |
| Decks | 6 |
| Shuffle | **Full reshuffle before every round** |
| Dealer | Stands on all 17 (S17) |
| Dealer peek | Yes, on ace or ten upcard |
| Blackjack pays | 3:2 |
| Double | Any first two cards |
| Split | Once, one hand per pair |
| Double after split | Not allowed |
| Re-split | Not allowed |
| Surrender | Not allowed |
| Insurance | Not offered in MVP |

Under this rule set the theoretical house edge against correct basic strategy is
approximately **0.55%**, and realised edge across a normal player population is materially
higher (typically 1.5% to 2.5%) because most players deviate from basic strategy. Both figures
should be measured empirically during balance testing rather than assumed.

### 5.2 Why reshuffle every round

Card counting works because information carries between rounds. A full reshuffle each round
makes every round statistically independent and reduces the edge advantage of counting to
zero. This is preferred over the alternatives:

- Betting limits on suspected counters: punishes skilled players, needs detection heuristics,
  and is not fun.
- Continuous shuffling machine fiction: same effect, more simulation code.
- Ignoring it: a counting player could invert the house edge, which breaks the economy's core
  premise that tables are a sink.

The cost is a small loss of realism, which is an acceptable trade for a provably closed
economy. Recorded as Owner decision D11 in case the Owner prefers realism over the guarantee.

### 5.3 Blackjack is the "smart money" table, by design

At roughly 0.55% versus slots at 5.175%, blackjack rewards a player who learns it. That
gradient is intentional and mirrors real casinos: the game that looks hardest is the one that
treats you best. It also gives the design a legitimate reason for `STANDING` to accrue on
wagered volume rather than losses, so a skilled blackjack player still progresses.

### 5.4 Dealt-by-a-player specifics

When a player holds the `DEALER` role at this table:

- The dealer's *decisions* are still fully rule-bound (S17 is enforced by the server). A
  player dealer cannot choose to hit or stand. They perform the ceremony, not the strategy.
- The server rejects any wager from the dealing player at their own table
  (`jobs-and-employment.md`).
- Card order comes from the server's shuffled shoe. The dealing player never sees hole cards
  before the players do; the hole card is not replicated to them until reveal.

That last point is the one real cheating vector in the whole game and it must be tested
explicitly. It is listed in `verification-notes.md`.

## 6. Invariants for implementation and test

| ID | Invariant |
| --- | --- |
| G1 | Outcomes are generated server-side from a CSPRNG, never from client-supplied or client-observable data |
| G2 | A round's stake debit and payout credit share one `roundId` idempotency key |
| G3 | Replaying a settled round returns the stored result and mutates nothing |
| G4 | Disconnect mid-round settles server-side: no refund, no double payout |
| G5 | Slots RTP measured over 10,000,000 simulated spins is 94.825% +/- 0.05pp |
| G6 | Roulette payout for every listed bet type yields exactly 36/37 return in a full-coverage test |
| G7 | Blackjack shoe is reshuffled before every round; two consecutive rounds show no dependence |
| G8 | Hole cards are never replicated to any client, including a player-dealer, before reveal |
| G9 | A bet below table minimum or above table maximum is rejected server-side |
| G10 | No payout can produce a fractional chip |
| G11 | Table margin credits `houseMarginAccrued`; no table path mints currency into a wallet beyond a settled win |

G5 and G6 are cheap, deterministic, headless tests and should be the first automated checks
written for this surface.

## 7. Explicitly out of MVP scope

Poker in any form (needs a player-vs-player rake model and a much larger UI), craps, baccarat,
sports betting, progressive jackpots, side bets, insurance, tournaments, and any game whose
outcome depends on another player's loss rather than the house.

Poker deserves a note: it is the most requested casino game and the worst fit for this
economy, because the house takes a rake from a pot that players fund for each other. That is a
transfer between players, which economy constraint C2 forbids in the MVP.

## 8. Open Owner decisions

D2 (house edge targets), D11 (per-round reshuffle vs. realism), D12 (slot max bet of 100
chips versus the 2500 table maximum). Recorded in `open-owner-decisions.md`.
