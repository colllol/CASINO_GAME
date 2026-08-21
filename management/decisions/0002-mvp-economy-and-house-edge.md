# Decision 0002 - MVP economy model and house edge

- Status: Proposed
- Owner gate: Required
- Related ticket: `management/backlog/0001-casino-world-mvp-foundation.md`
- Raised by: Game design surface, Phase 0
- Detail: `projects/game-design/documents/economy-closed-loop.md`,
  `projects/game-design/documents/casino-games-mvp.md`,
  `projects/game-design/documents/open-owner-decisions.md`

## Decision to make

Lock the MVP economy model so the Unreal and backend surfaces can build against fixed rules:
the currency set, the exhaustive faucet and sink lists, the house edge per game, and the
no-player-transfer rule.

This is separated from Decision 0001 because it is a product and economy decision, not a
technology one, and because the PM playbook already names economy as an explicit Owner gate.

## Proposed option

**Currencies.** Two: `CASH` (world wallet) and `CHIPS` (casino only, 1:1 with `CASH`, bought
and sold at the cage). Plus two non-spendable meters, `STANDING` and `HEAT`.

**Faucets (exhaustive).** Legal job payout, casino wage, casino salary, crime payout, quest
reward. Nothing else may mint currency. Owner income is a draw against accrued house margin,
not a faucet, and is capped at the accrued balance.

**Sinks (exhaustive).** Casino house margin, cosmetic purchase, police fine, bribe, casino
upkeep, cage spread (held at 0%), and the Q5 ownership buyout of 250,000 `CASH`. The buyout is
a one-time destruction, not a transfer: no wallet and no pool is credited.

**House edge.** Slots 5.175% (verified by exhaustive enumeration of 8000 combinations),
single-zero roulette 2.7027% uniform across all bet types, blackjack ~0.55% against basic
strategy with a full reshuffle every round.

**Closed-loop guarantees.**

1. No real-money purchase, deposit, withdrawal, or redemption of any in-game value.
2. No player-to-player currency or item transfer of any kind.
3. No loot boxes, randomised paid rewards, currency packs, or wagering of cosmetics.
4. All casino games are negative expected value for the player; no game is a net faucet.

Guarantee 2 is the one worth deliberate attention: it is a real feature cut (no gifting, no
trading, no player economy) bought in exchange for eliminating the account-farming and
real-money-trade surface completely. It is far cheaper to add trading later than to retrofit
anti-RMT controls onto a live economy.

## Alternatives considered

**A single currency instead of `CASH` plus `CHIPS`.** Simpler to implement and one fewer
conversion UI. Rejected because the cage is the only natural choke point between the world
economy and the gambling economy; collapsing it removes the place where conversion caps,
responsible-play throttles, and transaction review would later attach.

**Allow player-to-player transfer with rate limits.** More social and more expected by players
familiar with the genre. Rejected for the MVP: rate limits do not stop farming, they only slow
it, and the mitigation cost scales with the player base while the design benefit does not.

**Higher house edges across the board (American roulette at 5.26%, slots at 8-10%).** A larger
sink and therefore easier balance. Rejected because it makes tables feel punitive, and the
economy does not need it; jobs are the only faucets, so the loop already trends downward.

**Player-facing house edge control for owners.** Thematically attractive. Rejected because an
owner could tune tables to be player-positive and invert the sink.

## Consequences

Accepting this fixes the numeric targets that the transaction tests in
`projects/game-design/documents/verification-notes.md` assert against, and it makes the
faucet/sink lists a closed set; any later addition becomes a balance ticket rather than an
incidental implementation choice.

It also constrains the backend contract before that contract is designed: wallets must be
integer and non-negative, every mutation needs an idempotency key and a ledger row, there must
be no account-to-account transfer endpoint, and `houseMarginAccrued` must be a pool rather than
a wallet. Those constraints should be treated as inputs to Phase 2 rather than discovered
during it.

Blackjack at ~0.55% is the thinnest margin in the game and depends on the per-round reshuffle
holding. If the Owner prefers shoe realism (open item D11), the counting risk returns and
blackjack needs either a betting-limit mechanism or removal from the MVP.

## Owner decision

Pending. Record approval, rejection, or requested changes here before Phase 4 begins. Related
open items are tabulated as D1 through D16 in
`projects/game-design/documents/open-owner-decisions.md`; D2, D3, D6, D11, D12, and D13 are the
ones that change this record's numbers if answered differently.
