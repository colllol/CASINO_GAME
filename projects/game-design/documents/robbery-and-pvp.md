# Robbery, PvP, and the casino safe zone

- Status: Draft for Owner review
- Surface: Game design
- Ticket: `management/backlog/0003-phase1-rules-and-local-backend-contract.md`
- Phase: 1
- Related decision: `management/decisions/0003-phase1-rules-revision.md` (proposed)
- Supersedes: the "no player-versus-player" line in `gdd-casino-world-mvp.md` section 6

This document is normative for zone hostility, robbery, the LOOTABLE / PROTECTED item
classification, and the invariants that keep an involuntary transfer from becoming a
currency exploit.

## 1. What changed and why

Phase 0 specified no player-versus-player interaction at all, and economy constraint C2
banned every player-to-player transfer. The Owner has since directed that the MVP include
robbery outside the casino, with PvP automatically enabled there.

The design keeps the original guarantee where it actually mattered and narrows it:

| Phase 0 rule | Phase 1 rule |
| --- | --- |
| No player-to-player transfer of any kind | No **voluntary** transfer; robbery is the single involuntary transfer path |
| No PvP anywhere | PvP automatic outside the casino safe zone, impossible inside it |
| Cosmetics are non-transferable | Unchanged: cosmetics are BOUND and can never be looted |

The reason the ban was worth keeping in narrowed form is real-money trade. A voluntary
transfer is a delivery mechanism: two accounts can agree to move value, so an out-of-game
payment can be settled in-game. An involuntary transfer is not, because the victim does not
consent and cannot guarantee delivery. Robbery therefore adds player conflict without
reopening the account-farming surface, provided the rules in section 5 hold. This is the
central argument of the whole document and the thing to re-check if any rule below is
relaxed.

## 2. Zones

Every point in the district resolves to exactly one hostility class, server-side, from
authored volumes. There is no client-side determination and no player-facing toggle.

| Class | Where | PvP | Robbery |
| --- | --- | --- | --- |
| `SAFE` | Casino interior (floor, cage, bar, back area, office, vault), the entrance apron out to the valet stand, the police station interior and holding area | Disabled | Refused |
| `HOSTILE` | All streets, alleys, the delivery depot yard, the warehouse alley, the shop exterior, all other exterior space | Automatic | Allowed |

The shop interior is `HOSTILE`. A player carrying 12,000 `CASH` to buy an Exclusive cosmetic
is the most attractive target in the game and the walk to the tailor is meant to be the
risk. Making the shop safe would remove the only pressure the largest sink has.

### 2.1 Automatic PvP

Outside `SAFE` volumes, PvP is on. There is no opt-in, no consent prompt, no flag to raise,
and no PvE server mode. "Automatic" is the whole point: a player cannot audit whether the
stranger walking towards them is a threat, which is what makes banking a decision.

Three bounded exceptions exist, and they are anti-griefing measures rather than opt-outs:

| Exception | Duration | Reason |
| --- | --- | --- |
| Spawn immunity | 15 s after login or respawn | Stops spawn camping |
| Zone-exit immunity | 5 s after crossing `SAFE` -> `HOSTILE` | Stops door camping the casino exit |
| Victim recovery immunity | 120 s after being robbed | Stops the same player being farmed in a loop |

Immunity blocks being robbed. It does not let an immune player rob someone else: initiating
a robbery drops immunity immediately. Otherwise immunity becomes a free first strike.

## 3. Item and value classification

Every unit of value a player holds is exactly one of two classes. The default for anything
new is `PROTECTED`: a value becomes lootable only by being explicitly marked, never by
omission. This is a fail-closed rule and it is the single most important line in this
section, because the failure mode of the alternative is a quest item disappearing into
another player's inventory.

### 3.1 LOOTABLE

| Value | Notes |
| --- | --- |
| Carried `CASH` | The on-hand balance only. This is the primary robbery target |
| Contraband crates (job J4) | Already destructible on arrest; now also transferable by robbery |
| Unbound carried consumables | Bar drinks and similar; negligible value, listed for completeness |
| Robbery proceeds | Cash taken in a robbery is itself carried `CASH`, so it can be re-robbed |

### 3.2 PROTECTED

| Value | Why it is protected |
| --- | --- |
| Banked `CASH` | The bank is the counterplay; robbery must never reach it |
| `CHIPS` | Chips cannot leave the casino, and the casino is `SAFE`, so chips are unreachable by construction |
| Equipped cosmetics (all 6 slots) | Appearance is identity; losing it is punitive with no economic upside |
| Owned cosmetics, equipped or not | All shop grants are `BOUND` on grant, so they are non-transferable (invariant SH-adjacent, economy C2) |
| Insignia items (4) | Quest-granted proof of the hidden chain; `HQ8` already forbids any non-quest acquisition path |
| Starter loadout | The free default items granted at first login; a player must never be reducible below a presentable state |
| Quest items and note fragments | Bound to the quest stage and to the player; looting them would break `HQ3` and `HQ4` |
| Active job items (parcels, cash box, envelope) | Bound to `jobInstanceId`; looting them would break job payout idempotency |
| Outstanding debt | A liability, not an asset; it stays with the player who incurred it |
| `STANDING`, `HEAT`, employment role, quest stage | Not items and not currency; they never appear in a loot window |

### 3.3 The bound flag

`BOUND` is a property of a granted item instance, not of a catalogue entry. Every grant path
in the game (shop purchase, quest reward, starter loadout, job issue) sets `BOUND` at grant
time. There is no unbind operation in the MVP and no design intent to add one.

## 4. Robbery flow

Robbery is a bounded, server-arbitrated interaction with a fixed state machine. It is not
combat and it does not use a damage model.

```text
IDLE
  -> INITIATED   (aggressor holds the prompt on a valid target in a HOSTILE zone)
  -> CONTESTED   (fixed window; victim may flee, break line of sight, resist, or comply)
  -> (RESOLVED_SUBDUED | RESOLVED_ESCAPED | RESOLVED_ABORTED)
  -> SETTLED     (only from RESOLVED_SUBDUED; one transaction group)
  -> AFTERMATH   (heat applied to the aggressor, recovery immunity to the victim)
```

Preconditions checked server-side at `INITIATED`, all of them:

1. Aggressor and victim are both in a `HOSTILE` zone.
2. Victim holds no active immunity from section 2.1.
3. Aggressor is within 3 m with unbroken line of sight.
4. Aggressor is not on shift in any casino employment role.
5. The server's robbery economy parameters are configured (section 6).

Escape conditions during `CONTESTED`: reaching any `SAFE` volume, breaking line of sight for
2 continuous seconds, or winning the resistance contest. Reaching a `SAFE` volume is always
sufficient, which is what makes the casino door meaningful in both directions.

`RESOLVED_SUBDUED` puts the victim in a `SUBDUED` state for a short fixed duration during
which the loot window is open to the aggressor and closed to everyone else. The victim is
not killed, does not drop their inventory to the world, and does not lose position.

### 4.1 Non-lethal by default

The MVP proposal is a non-lethal subdual: a hold-up and a struggle, no weapons, no health
bar, no damage numbers, no death. This keeps combat prediction and hit registration off the
critical path, which was the original reason PvP was excluded, while still delivering the
conflict the Owner asked for.

Whether the Owner wants lethal combat instead is a genuine product question with a large
netcode cost attached, and it is recorded as an open decision rather than settled here.

## 5. Why robbery is not a currency exploit

Robbery is a **redistribution**, not a faucet and not a sink. It moves existing `CASH`
between two wallets and mints nothing. The economy's faucet list stays closed at F1 to F5.

Four properties do the work:

1. **Zero-sum settlement.** The victim debit and the aggressor credit are one atomic
   transaction group sharing a `robberyId`. Their magnitudes are equal. A group with one leg
   is a defect, not a partial success.
2. **No consent, so no delivery guarantee.** Real-money trade needs a seller who can promise
   delivery. A robber cannot promise to be robbed, and a victim cannot promise to be found.
3. **Nothing bound can move.** Every durable status object in the game is `BOUND`, so the
   only thing that changes hands is fungible carried `CASH` the victim chose not to bank.
4. **Heat prices it.** Robbery raises the aggressor's heat, and heat is priced in casino
   access, so a career robber loses the ability to spend what they take.

Farming two accounts against each other is still possible in principle: log in as A, walk to
an alley, rob A with B. It gains the pair nothing, because no currency is created and the
robber pays heat. Detection is therefore not required in the MVP; the design removes the
incentive instead of policing the behaviour. Written down explicitly so a later change that
makes robbery net-positive is recognised as the economy break that it would be.

## 6. Unset economy parameters (Owner gate)

How much a robbery takes is a loss percentage, which this surface is not permitted to
settle. The parameters below are therefore declared with **no default value**. They are
server configuration, read at startup, and the server must **refuse to enable robbery** while
any of them is unset. Failing closed is deliberate: an accidental zero would silently ship a
robbery system that takes nothing, and an accidental 100 would ship one that takes
everything.

| Parameter | Meaning | Value |
| --- | --- | --- |
| `robberyCarriedCashShareBps` | Share of the victim's carried `CASH` transferred on a successful robbery, in basis points | Unset - Owner gate D17 |
| `robberyCarriedCashCap` | Absolute per-robbery ceiling on transferred `CASH`, if any | Unset - Owner gate D17 |
| `robberyContrabandShare` | Whether a successful robbery takes all, some, or none of the carried crates | Unset - Owner gate D17 |
| `robberyCooldownSeconds` | Per-aggressor cooldown between robberies | Unset - Owner gate D18 |

Everything else in this document is a mechanism, a boundary, or a safety property, and none
of it depends on the values above. Implementation of the state machine, the zone volumes, the
classification, and the logging can proceed while D17 and D18 are open; only the transfer
magnitude is blocked.

Balance-shaped values that are *not* loss percentages follow the Phase 0 convention and are
proposed starting points for balance testing, not final tuning: the 3 m initiation range, the
2 s line-of-sight break, and the three immunity durations in section 2.1.

## 7. Heat and the police

Robbery is a crime and it feeds the existing `HEAT` meter. The heat values and the report
mechanic are specified in `police-and-heat.md` section 3, which is normative. The design
intent, stated here because it belongs with the robbery rules:

- A victim always files a report, so a robbery always costs heat even with no witness. A
  crime with a living, logged-in witness cannot be quiet.
- A patrol witnessing the robbery costs materially more heat than the report alone.
- Heat is what makes robbery self-limiting. At tier 3 the casino door and the shop both
  refuse the player, so a successful robber holds cash they cannot convert or spend. The
  currency they took becomes strictly less useful in their hands than in the victim's.

## 8. Counterplay and the victim's side

A design where the only agency is the aggressor's is a griefing simulator. The victim has
four levers, all of which existed before robbery and now have teeth:

| Lever | Effect |
| --- | --- |
| Bank the cash | Banked `CASH` is `PROTECTED`. The one decision that makes a player unrobbable in practice |
| Reach a `SAFE` volume | Always a sufficient escape, from any point in `CONTESTED` |
| Break line of sight | 2 continuous seconds ends the attempt |
| Resist | Wins the contest outright and applies the aggressor's cooldown |

Losses are bounded by construction: a robbed player keeps their bank, their chips, their
cosmetics, their Insignia items, their quest progress, their role, and their starter
loadout. The worst case is the carried cash they chose not to bank, which is a decision they
made, not an outcome they were handed.

## 9. Explicitly out of scope

- Lethal combat, weapons, health, damage, or death (open decision D19).
- Robbing NPCs, shops, the cage, or the vault. The vault remains a quest object only.
- Robbery inside any `SAFE` volume, by any mechanism, including reaching through a boundary.
- Item stealing of any kind. Only carried `CASH` and contraband move.
- Voluntary trading, gifting, dropping items for another player, or a shared stash. All of
  these are delivery mechanisms and all remain banned by economy constraint C2.
- Bounty, revenge-marking, or player-versus-player heat mechanics.
- Player-controlled police, unchanged from Phase 0.

The fourth and fifth rows are the ones most likely to be "helpfully" added by an
implementation agent. A dropped item is a voluntary transfer with extra steps.

## 10. Invariants for implementation and test

| ID | Invariant |
| --- | --- |
| RB1 | Zone hostility is resolved server-side from authored volumes; no client input contributes |
| RB2 | A robbery initiated when either party is in a `SAFE` volume is rejected server-side |
| RB3 | Every value is `LOOTABLE` only by explicit mark; the default for any new value type is `PROTECTED` |
| RB4 | No `BOUND` item can appear in a loot window, be transferred, or be destroyed by robbery |
| RB5 | Banked `CASH`, `CHIPS`, cosmetics, Insignia, starter, quest, and active-job items are never transferred by robbery |
| RB6 | Victim debit and aggressor credit share one `robberyId` and are equal in magnitude |
| RB7 | Robbery mints no currency and burns none; circulating `CASH` is unchanged across a settled robbery |
| RB8 | A robbery settles exactly once; replay with the same `robberyId` returns the stored result |
| RB9 | Disconnect by either party during `CONTESTED` resolves server-side and never leaves value in limbo |
| RB10 | Disconnect by the victim after `RESOLVED_SUBDUED` still settles; logging off is not an escape |
| RB11 | Wallets never go negative during settlement; the transfer is clamped to the victim's carried balance (economy I2) |
| RB12 | Immunity windows are server-tracked; initiating a robbery drops the initiator's immunity |
| RB13 | The server refuses to enable robbery while any section 6 parameter is unset |
| RB14 | Every state transition and every settlement writes an append-only authoritative event (backend logging contract) |
| RB15 | A player on a casino employment shift cannot initiate a robbery |
| RB16 | No API accepts a *voluntary* transfer between accounts; robbery is the only transfer path and it requires the full state machine (economy I9 as amended) |

RB3, RB6, and RB7 are the three that keep the economy closed. RB4 and RB5 are the two that
keep a robbery from becoming a permanent loss of progress. If a test budget forces a choice,
those five come first.

## 11. Open Owner decisions

D17 (robbery transfer share and cap), D18 (robbery cooldown), D19 (non-lethal subdual versus
lethal combat), D20 (whether a carried-cash cap should exist at all), D21 (amending economy
constraint C2 from "no transfer" to "no voluntary transfer"). Recorded in
`open-owner-decisions.md`.
