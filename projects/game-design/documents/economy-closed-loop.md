# Economy - virtual closed loop

- Status: Draft for Owner review
- Surface: Game design
- Ticket: `management/backlog/0001-casino-world-mvp-foundation.md`;
  Phase 1 revision under `management/backlog/0003-phase1-rules-and-local-backend-contract.md`
- Related decisions: `management/decisions/0002-mvp-economy-and-house-edge.md` (proposed),
  `management/decisions/0003-phase1-rules-revision.md` (proposed)

This document is normative for currency definition, faucets, sinks, caps, and invariants.
All numeric values are MVP starting points for balance testing, not final tuning.

## 1. Non-negotiable constraints

C1. All currency in the game is virtual. It cannot be purchased with real money, sold,
gifted outside the game, traded between accounts, or redeemed for anything of real value.

C2. There is no **voluntary** player-to-player currency or item transfer in the MVP: no
trading, gifting, dropping for another player, shared stash, mailing, or rake. The single
involuntary transfer path is robbery in a `HOSTILE` zone, specified in `robbery-and-pvp.md`
and bounded by invariants RB3 to RB16.

The distinction is the whole safety argument and is worth stating plainly: a voluntary
transfer is a delivery mechanism that lets an out-of-game payment be settled in-game, which
is the real-money-trade and account-farming surface. Robbery is not, because the victim does
not consent and neither party can guarantee delivery. This amendment to the Phase 0 wording
is recorded as Owner decision D21.

C3. No loot boxes, no randomised paid rewards, no wagering of cosmetics, no currency
packs, no battle pass. The shop sells known items at known prices.

C4. Currency is created only by named faucets in section 3 and destroyed only by named
sinks in section 4. Any code path that mints or burns currency outside those lists is a
bug, not a feature. The lists are closed: adding to either one requires a balance ticket.
Robbery is neither: it is a redistribution, see section 6.1.

C5. Changing C1 through C4 requires a fresh Owner gate and, per the PM playbook, a legal
and product review. Design agents may not relax them.

## 2. Currencies and meters

| Name | Kind | Scope | Purpose |
| --- | --- | --- | --- |
| `CASH.carried` | Currency | On-hand wallet, persisted | The spendable balance; the only robbery target |
| `CASH.banked` | Currency | Cage deposit account, persisted | Safe storage; `PROTECTED` from robbery |
| `CHIPS` | Currency | Casino only, persisted | The only stake accepted at tables |
| `STANDING` | Score | Persisted, non-spendable | Casino trust; gates the hidden quest and employment |
| `HEAT` | Meter | Persisted, decays | Police attention; gates casino and shop access |

`CASH.carried` and `CASH.banked` are one currency in two containers, not two currencies.
Deposit and withdrawal happen at the cage, are 1:1, and are free. Together they are referred
to as `CASH` wherever the container does not matter.

The split exists because robbery needs a decision attached to it. If all cash were equally
robbable, the only strategy would be to hold nothing; if none were, robbery would be
theatre. Because the cage is inside the casino `SAFE` zone, banking always costs a walk, and
that walk is the game.

`CASH` and `CHIPS` are deliberately separate. The cage is the single choke point between
the world economy and the gambling economy, which gives one auditable boundary for
conversion caps, responsible-play throttles, and transaction review.

`STANDING` and `HEAT` are not currencies. They are never mintable by trade and never
appear in the wallet ledger.

## 3. Faucets - the only ways currency is created

A faucet mints `CASH` from nothing. There are five, all server-side.

| ID | Faucet | Rate (MVP target) | Gate |
| --- | --- | --- | --- |
| F1 | Legal job payout | 220 to 400 `CASH` per completed shift | Job available, player on shift |
| F2 | Casino wage (dealer) | 350 `CASH` per shift + 5% of table rake | Employment role `DEALER` |
| F3 | Casino salary (floor manager) | 600 `CASH` per shift + 10% revenue share | Employment role `FLOOR_MANAGER` |
| F4 | Crime payout | 400 to 900 `CASH` per completed job | Crime opportunity active |
| F5 | Quest reward | Fixed, one-time per stage, 0 to 2500 `CASH` | Hidden quest stage completion |

Owner income is **not** a faucet. An owner receives a share of house margin, which is
currency already destroyed by table settlement. See section 6.

Target honest income is roughly 900 to 1300 `CASH` per hour of active play. Crime is
capped near 1600 `CASH` per hour and pays a heat cost that eats into it, so the two paths
converge in effective value while feeling different in tempo.

Every faucet emits a ledger entry with `reason`, `sourceId`, and an idempotency key so a
reconnect cannot double-pay. This is a backend contract requirement, recorded in
`verification-notes.md`.

## 4. Sinks - the only ways currency is destroyed

| ID | Sink | Magnitude | Notes |
| --- | --- | --- | --- |
| S1 | Casino house margin | 0.5% to 5.2% of wagered volume across the three tuned games; jackpot machine unset (D22) | Primary sink, see section 5 |
| S2 | Cosmetic purchase | 150 to 12000 `CASH` | Permanent, no resale, see `shop-and-cosmetics.md` |
| S3 | Police fine | 200 to 3500 `CASH` by heat tier | Cleared at booking desk |
| S4 | Bribe | 2x the equivalent fine | Optional fast heat clear, raises suspicion |
| S5 | Casino rent / upkeep | 1500 `CASH` per real-time day | Owners only |
| S6 | Cage conversion spread | 0% in MVP | Reserved lever, see section 7 |
| S7 | Casino ownership buyout | 250,000 `CASH`, one-time per acquisition | Paid to the NPC house, which is not a wallet; see `hidden-quest-back-room.md` |

S7 is the largest single sink in the game and the intended endgame drain. It is a destruction,
not a transfer: no wallet and no pool is credited.

Chips are destroyed when lost at a table and minted when won, but only inside a settled
round whose net across all seats is negative-or-equal for the players. Chips never leave
the casino: cashing out converts `CHIPS` back to `CASH` at 1:1.

## 5. House edge and why the loop stays closed

Each MVP game is tuned to a fixed house edge. The full paytables and derivations live in
`casino-games-mvp.md`; the summary is:

| Game | Target house edge | Player-visible RTP |
| --- | --- | --- |
| Slots | 5.175% (measured, exhaustive) | 94.825% |
| Roulette (single zero) | 2.7027% (uniform, all bet types) | 97.2973% |
| Blackjack (house rules) | ~0.55% against basic strategy; higher in practice | ~99.45% best case |
| Jackpot machine | Unset - Owner gate D22 | Unset - Owner gate D22 |

The slots and roulette figures are verified by enumeration, not estimated. Blackjack's
realised edge must be measured during balance testing because it depends on how well the
player population plays. The jackpot machine's odds and paytable are deliberately left unset
by this surface; see `casino-games-mvp.md` section 6 and Owner decision D22.

Because every table is negative expected value and jobs are the only faucets, total
currency in circulation trends downward without work. The economy is therefore
self-correcting: a currency oversupply increases gambling volume, which increases the
amount destroyed.

Blackjack is the one game where player skill affects the edge. Card counting is neutralised
by reshuffling a 6-deck shoe every round rather than at a cut card. This keeps the game
honest without the anti-fun of surveillance or betting limits.

## 6. Movements that are neither faucet nor sink

Three value movements exist that neither mint nor destroy currency. They are enumerated here
so that no implementation mistakes one of them for a faucet.

### 6.1 Owner income - a share of margin, not a mint

An owner's payout is drawn from `houseMarginAccrued`, a server-side pool credited by S1 as
rounds settle. The pool is not a wallet and cannot go negative. Owner payout is
`min(requestedDraw, houseMarginAccrued)` and debits the pool.

This is the critical anti-inflation rule: **owner income can never exceed what players have
actually lost.** If the floor is empty, the owner earns nothing and still owes S5 upkeep.

### 6.2 Robbery - a redistribution, not a faucet

Robbery moves `CASH.carried` from one wallet to another. The victim debit and the aggressor
credit are equal, atomic, and share one `robberyId`. Circulating currency is unchanged.

Robbery is therefore invisible to the faucet/sink accounting in invariant I5, and any test of
I5 must remain green across an arbitrary number of robberies. If a robbery ever changes the
circulating total, the bug is in settlement, not in balance. Rules, bounds, and the
`LOOTABLE` / `PROTECTED` classification are in `robbery-and-pvp.md`.

### 6.3 Jackpot pool - a deferred sink payout

The jackpot machine funds its prize from a fixed share of the house margin it generates,
accrued into a `jackpotPoolAccrued` balance. A jackpot hit pays from that pool and debits it.
The pool is not a wallet, cannot go negative, and is never topped up from anything except its
own machine's margin.

This makes a jackpot hit a **return of currency already destroyed by S1**, not a new faucet.
The consequence worth understanding: the jackpot cannot pay more than players have already
lost to that machine plus its configured seed, so the headline prize grows with play rather
than being funded by the economy at large.

The seed value, the contribution share, and the hit odds are all unset pending Owner decision
D22.

## 7. Reserved levers (not in MVP, listed to prevent accidental invention)

- Cage conversion spread (S6) held at 0%; a future balance ticket may raise it.
- Session wager caps and cool-down timers for responsible-play behaviour.
- A cap on `CASH.carried` that forces banking above a threshold (Owner decision D20).

The progressive slot jackpot previously reserved here has been activated by Owner direction
as the fourth casino game, funded exactly as reserved: from a fixed share of S1 rather than
from a new faucet. See section 6.3.

Any of these requires a balance ticket. An agent must not introduce them while implementing
something else.

## 8. Invariants for implementation and test

| ID | Invariant |
| --- | --- |
| I1 | No client input can increase a wallet balance directly; all mutations are server-side |
| I2 | Wallet balances are integers and never negative |
| I3 | Every mutation writes exactly one ledger row with an idempotency key |
| I4 | Replaying a mutation with the same idempotency key is a no-op returning the first result |
| I5 | Sum of all faucet credits minus sum of all sink debits equals total currency in circulation, and is unaffected by any number of robberies |
| I6 | A settled casino round's net player delta is <= 0 in expectation and its chip delta sums to zero against the house pool |
| I7 | Disconnect mid-round settles the round server-side; the player's stake is neither refunded nor double-paid |
| I8 | Owner draw never exceeds `houseMarginAccrued` |
| I9 | No API accepts a **voluntary** transfer between two player accounts; the robbery state machine is the only transfer path (RB16) |
| I10 | `STANDING` and `HEAT` never appear in the wallet ledger and are never spendable |
| I11 | `CASH.carried` and `CASH.banked` are one currency; deposit and withdrawal are 1:1, atomic, and change no total |
| I12 | Only `CASH.carried` is reachable by robbery; `CASH.banked` and `CHIPS` are never reachable (RB5) |
| I13 | A jackpot payout never exceeds `jackpotPoolAccrued` and debits it by exactly the amount paid |
| I14 | The server refuses to start with any economy parameter in the unset state (robbery share, jackpot odds, jackpot contribution, jackpot seed) |

These are the acceptance targets for the transaction tests named in ticket 0001's
verification plan and extended by ticket 0003.

## 9. Open Owner decisions

Recorded in `open-owner-decisions.md`: D2 (house edge values), D3 (crime income parity),
D6 (no voluntary player trading, as narrowed by C2), D7 (offline heat decay), D17 (robbery
transfer share), D20 (carried-cash cap), D21 (C2 amendment), D22 (jackpot odds, contribution
share, and seed).
