# Decision 0003 - Phase 1 rules revision

- Status: Approved for Phase 1; post-MVP tuning open
- Owner gate: Approved for Phase 1 on 2026-08-21
- Related ticket: `management/backlog/0003-phase1-rules-and-local-backend-contract.md`
- Raised by: Game design and backend surfaces, Phase 1
- Supersedes in part: `management/decisions/0002-mvp-economy-and-house-edge.md` guarantee 2
- Detail: `projects/game-design/documents/robbery-and-pvp.md`,
  `projects/game-design/documents/economy-closed-loop.md`,
  `projects/game-design/documents/casino-games-mvp.md`,
  `projects/game-design/documents/gdd-casino-world-mvp.md`,
  `projects/backend/documents/local-profile-persistence-adapter.md`,
  `projects/backend/documents/authoritative-event-log.md`

## Decision to make

Approve five rule changes that the Owner directed after Phase 0, so the Unreal and backend
surfaces can build Phase 1 against fixed rules:

1. Windows-only for the MVP: Windows client and Windows dedicated server.
2. Ten concurrent players, replacing the Phase 0 figure of four.
3. Four casino games, adding a jackpot machine to slots, roulette, and blackjack.
4. No **voluntary** player-to-player trading, narrowing the Phase 0 ban on all transfer.
5. Robbery outside the casino safe zone, with PvP automatically enabled there.

Plus one contract decision the above forces: a local, versioned, idempotent persistence adapter
for Phase 1, with the TypeScript/PostgreSQL service deferred until Decision 0001 is approved.

This is a separate record from 0002 because item 4 amends a guarantee that 0002 already asked the
Owner to approve, and amending an approved guarantee silently would be the wrong way to do it.

## Proposed option

**Platform and scale.** Windows 10/11 64-bit client and a Windows dedicated server, ten
concurrent players on one instance, one 400m x 400m district. No Linux server target, no console,
no mobile, no cloud deployment. Detail in `gdd-casino-world-mvp.md` section 5.

**The fourth game.** A single-cabinet jackpot machine with a fixed stake, funded by a share of
the house margin it generates into a `jackpotPoolAccrued` pool. A hit pays the pool and resets it
to a seed. The pool is credited only by that machine's own margin, so the machine cannot pay more
than players have already lost to it plus the one-time seed. It is therefore a deferred sink
payout, not a new faucet, and the closed faucet list F1-F5 is unchanged.

**Voluntary transfer stays banned; robbery is the single exception.** Economy constraint C2
becomes "no voluntary player-to-player currency or item transfer" with robbery in a `HOSTILE`
zone as the only involuntary path. No trading, gifting, dropping for another player, shared
stash, mailing, or rake.

**Robbery and automatic PvP.** Every point in the district resolves server-side to `SAFE` (casino
and police station interiors, the casino entrance apron) or `HOSTILE` (everything else). PvP is
automatic in `HOSTILE` space with no opt-in and no PvE mode, bounded by a short spawn protection
window only. Robbery is a non-lethal subdual with a fixed server-side
state machine, no weapons, no health, and no damage model.

**LOOTABLE versus PROTECTED.** Only carried `CASH` and contraband crates are lootable. Banked
`CASH`, `CHIPS`, all cosmetics, the four Insignia items, the starter loadout, quest items and
note fragments, active job items, outstanding debt, `STANDING`, `HEAT`, employment role, and
quest stage are all protected. The default for any newly added value type is `PROTECTED`; a value
becomes lootable only by explicit mark.

**Server authority and logging.** Robbery arbitration, heat mutation, and jackpot pool accounting
are server-authoritative and write to an append-only authoritative event log with a closed event
taxonomy and closed cause enumerations. Pool and wallet balances must be reconstructable by
replaying the log.

**Persistence.** A local, in-process, file-backed adapter with a single `schemaVersion`,
forward-only idempotent migrations, caller-supplied idempotency keys that return the stored first
result on replay, all-or-nothing transaction groups, and one-to-one record-to-table mapping so
the Decision 0001 service replaces it as a backend-only change.

**Developer-tuned defaults approved for Phase 1.** Robbery transfers 100% of carried `CASH`,
has no absolute cap, no gameplay cooldown, and no post-robbery victim immunity; only explicit
`LOOTABLE` items may additionally be selected. Jackpot terminals use four fixed stake tiers in
budget, middle, and VIP zones, with defaults and odds recorded in `casino-games-mvp.md`.
The developer may tune the server-only versioned config, but the server rejects missing config
or RTP at/above 100% and clients cannot change it.

## Alternatives considered

**Keep the Phase 0 no-PvP rule.** Cheapest option and it keeps combat netcode entirely out of the
project. Rejected because the Owner directed robbery into the MVP, and because the open world
otherwise has no reason for players to notice each other outside the casino.

**Lethal PvP combat with weapons, health, and damage.** More conventional for the genre.
Recommended against, and recorded as open decision D19, because it puts hit registration and
combat prediction on the critical path of a phase whose purpose is proving the economy rules. The
non-lethal subdual delivers the requested conflict at a fraction of the netcode cost.

**Make the whole district PvP-optional, or add a PvE server mode.** Safer for new players.
Rejected because it removes the only thing that makes banking a decision: if a player can audit
whether a stranger is a threat, carrying cash stops being a risk and the cage becomes decoration.

**Allow robbery of items as well as cash.** More dramatic. Rejected because every durable item is
`BOUND` at grant, and unbinding items to make them lootable would reopen the delivery mechanism
that the voluntary-transfer ban exists to close, as well as making quest progress losable.

**Ship the TypeScript/PostgreSQL service now instead of a local adapter.** Avoids building a
throwaway. Rejected because the external service contract is still out of Phase 1; the adapter's
interface is scoped so the service replaces it without gameplay changes.

**Keep four concurrent players.** Lower replication cost and a smaller test matrix. Rejected
because four players in a 400m district almost never meet, which would make robbery a mechanic
that exists in documents and not in play.

## Consequences

Approving this makes the `LOOTABLE` / `PROTECTED` classification and the zone hostility model
contracts that the Unreal and backend surfaces build against, and it adds robbery settlement,
jackpot pool accounting, and the event log to the transaction-invariant obligations already set by
Decision 0002.

The verification obligation grows from 28 assertions to 78. The new ones are T29-T78 in
`projects/game-design/documents/verification-notes.md`, and the five worth writing first are T31,
T34, T35, T32, and T33: three keep the economy closed and two keep a robbery from destroying
progress.

It also constrains the backend contract before Decision 0001 resolves: integer money everywhere,
no transfer primitive between accounts, pools rather than wallets for accrued margin, and an event
durable before the mutation it describes is acknowledged. Those are inputs to Phase 1, not
discoveries to be made during it.

Two consequences are worth stating as risks rather than as features. First, ten players raise
contention on shared job stations, simultaneous robbery arbitration, and casino-floor replication
cost; all three are recorded in the risk register and in T75-T78 rather than assumed away. Second,
the local adapter is risk R14: a bridge that becomes load-bearing is expensive to remove, which is
why its replacement path is specified now while it is still cheap to constrain.

Approving items 4 and 5 does not weaken constraint C1. No currency is created, no value leaves the
game, and nothing becomes purchasable with real money. The safety argument rests on the
voluntary/involuntary distinction: a voluntary transfer is a delivery mechanism that lets an
out-of-game payment settle in-game, and robbery is not, because neither party can guarantee
delivery. If a future change ever makes robbery net-positive or adds a consensual transfer path,
that argument fails and this record should be reopened.

## Owner decision

Owner-approved for Phase 1 direction on 2026-08-21: Windows-only, ten players, four games,
no voluntary trading, hostile-zone robbery/PvP, full carried-cash robbery with optional
lootable items, no gameplay robbery cooldown, and developer-tuned zone/tier jackpot defaults.
Decision 0003 remains Proposed only for post-MVP tuning; D17, D18, D21, D22, D23, D24, and D25
are resolved for the Phase 1 prototype. The related open items are D17 through D25 in
`projects/game-design/documents/open-owner-decisions.md`.
