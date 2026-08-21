# GDD - Casino World MVP

- Status: Draft for Owner review
- Surface: Game design
- Ticket: `management/backlog/0001-casino-world-mvp-foundation.md`
- Phase: 0
- Related decisions: `management/decisions/0001-engine-and-service-stack.md` (proposed),
  `management/decisions/0002-mvp-economy-and-house-edge.md` (proposed)

This document is the entry point for the game design surface. It defines the product
concept, the player loop, and the MVP scope fence. Detailed systems live in sibling
documents and are normative where they conflict with the summaries here.

| System | Document |
| --- | --- |
| Currencies, faucets, sinks, invariants | `economy-closed-loop.md` |
| Jobs, wages, dealer employment | `jobs-and-employment.md` |
| Slots, blackjack, roulette rules and math | `casino-games-mvp.md` |
| Cosmetic shop and pricing ladder | `shop-and-cosmetics.md` |
| Hidden quest to employment and ownership | `hidden-quest-back-room.md` |
| Crime, police heat, pursuit, penalties | `police-and-heat.md` |
| Unresolved Owner gates | `open-owner-decisions.md` |
| Design-side verification obligations | `verification-notes.md` |

## 1. Concept

Casino World is a third-person / first-person hybrid multiplayer entertainment game set in
a small night-time city district built around one casino. Players earn virtual currency
through honest work or crime, gamble it on real casino games, and can follow a hidden
chain of favours from customer to dealer to floor manager to casino owner.

The fantasy is social mobility inside a single building: every player on the server can
see the same tables, and the person dealing your blackjack hand may be another player who
found the back room before you did.

## 2. Design pillars

1. **One honest economy.** All currency is virtual and closed-loop. Nothing is buyable
   with real money and nothing is redeemable for real money. See
   `economy-closed-loop.md` and the Owner gate in `management/pm-playbook.md`.
2. **The house always wins, slowly.** Casino games are the primary currency sink, never a
   faucet. Every table is mathematically negative expected value for the player and is
   engineered so that skill or counting cannot invert that.
3. **Work is the faucet.** Predictable income comes from jobs. Gambling redistributes and
   destroys; it does not create.
4. **Crime is a shortcut with a toll.** Illegal earning is faster per minute but raises
   police heat, and heat is priced in exactly the currency the casino wants: access.
5. **Progression is social, not statistical.** There are no combat stats or power upgrades.
   Progress is measured in access, standing, cosmetics, and eventually ownership.
6. **The server is the only truth.** Currency, inventory, quest state, casino outcomes,
   heat, and ownership are server-authoritative and transaction logged.

## 3. Player loop

### 3.1 Core minute-to-minute loop

```text
      +--------------------------------------------------+
      |                                                  |
      v                                                  |
  EARN  ->  BANK  ->  CONVERT  ->  WAGER  ->  OUTCOME  ---+
 (jobs   (deposit  (cage: CASH  (tables/   (win: chips up
  or      CASH at   -> CHIPS)    slots)     lose: chips gone
  crime)  the cage)                         either way: STANDING up)
      |                                                  |
      |                                                  v
      +---------------- SPEND (shop cosmetics, fines, rent, bribes)
```

The loop is intentionally lossy. A player who only gambles trends to zero and must return
to the earn step; that return trip is the pacing mechanism for the whole game.

### 3.2 Session loop (20 to 60 minutes)

1. Spawn in the district with persisted wallet, cosmetics, `STANDING`, and `HEAT`.
2. Pick an earner: a legal job shift or a crime opportunity.
3. Walk to the casino, clear the door check (heat gate), buy chips at the cage.
4. Play one or more tables. `STANDING` accrues from wagering volume, not from winning.
5. Cash out remaining chips, spend on cosmetics, pay off outstanding fines.
6. Log off with a persisted wallet and a decaying heat value.

### 3.3 Progression loop (multi-session)

```text
CUSTOMER --standing + observed play--> NOTICED
   |
   +--hidden back-room trigger--> RECRUITED (quest Q1)
        |
        +--complete favour chain--> DEALER (paid casino job)
             |
             +--shift performance--> FLOOR MANAGER (revenue share)
                  |
                  +--buyout + clean record--> OWNER (house edge income, staff roster)
```

The ownership rung closes the loop back on itself: an owner's income is other players'
losses, so an owner is motivated to keep tables staffed and the floor busy. Detailed stage
gates are in `hidden-quest-back-room.md`.

## 4. World

The MVP world is one walkable night-time district sized for four concurrent players, not a
city. Target footprint is roughly 400m x 400m so it can be authored, lit, and performance
tested by a small agent team.

| Zone | Contents | Purpose |
| --- | --- | --- |
| Casino ground floor | Cage, 1 blackjack table, 1 roulette table, 4 slot machines, bar | Primary sink and social hub |
| Casino back area | Staff door, back room, manager office, vault door | Hidden quest and employment |
| Street block | Sidewalks, alleys, parked cars, police patrol route | Traversal and pursuit space |
| Workplaces | Delivery depot, valet stand, bar service point | Legal job faucets |
| Shop | Tailor storefront | Cosmetic sink |
| Police station | Booking desk, fine terminal | Heat sink and respawn point |

Interior and exterior are one seamless level in the MVP. No world partitioning or streaming
is required at this footprint; that call belongs to the Unreal surface.

Camera: third-person by default for traversal, with an automatic transition to a seated
first-person framing when a player takes a table seat. The transition itself is an Unreal
surface deliverable and is already named in ticket 0001 Phase 1.

## 5. Player character

No classes, no levels, no combat stats. A character is defined by:

- wallet (`CASH`, `CHIPS`)
- cosmetic loadout (6 slots, see `shop-and-cosmetics.md`)
- `STANDING` with the casino
- `HEAT` with the police
- employment role (`NONE`, `DEALER`, `FLOOR_MANAGER`, `OWNER`)
- quest state for the hidden chain

There is no player-versus-player damage in the MVP. Conflict is economic and social. This
removes netcode-heavy combat prediction work from the critical path.

## 6. System summaries

Each row links to the normative document. Where this table and the document disagree, the
document wins.

| System | One-line summary | Document |
| --- | --- | --- |
| Economy | `CASH` in the world, `CHIPS` in the casino, five faucets, seven sinks, no player trading | `economy-closed-loop.md` |
| Jobs | 3 legal jobs (delivery, valet, bar), 1 crime job (warehouse), all server-arbitrated | `jobs-and-employment.md` |
| Casino games | Slots (5.175% edge), single-zero roulette (2.7027%), 6-deck blackjack reshuffled every round | `casino-games-mvp.md` |
| Shop | 42 fixed-price cosmetics in 6 slots, 4 quest-only Insignia items, no loot boxes | `shop-and-cosmetics.md` |
| Hidden quest | Q0 to Q5: noticed -> vouched -> recruited -> dealer -> floor manager -> owner | `hidden-quest-back-room.md` |
| Police heat | 0-100 in 5 tiers; tier 3 refuses the casino door and the shop | `police-and-heat.md` |

## 7. MVP scope fence

### In scope

- One district, one casino, seamless interior/exterior.
- Four concurrent players on an authoritative dedicated server, with reconnect and persistence.
- Three legal jobs, one crime job.
- Three casino games: slots, roulette, blackjack.
- Cosmetic shop with 42 items and 6 equip slots.
- The full Q0 to Q5 hidden quest chain, including playable `DEALER`, `FLOOR_MANAGER`, and
  `OWNER` roles.
- Police heat with NPC-only pursuit and arrest.
- Third-person traversal with a first-person seated table camera.

### Out of scope (and why)

| Excluded | Reason |
| --- | --- |
| Real-money purchase, deposit, withdrawal, or trading | Owner gate; economy constraints C1 to C3 |
| Player-to-player currency or item transfer | Removes the RMT and farming surface entirely (C2) |
| Poker in any form | Rake is a player-to-player transfer, which C2 forbids |
| Player-versus-player combat, weapons, damage | Keeps combat netcode off the critical path |
| Player-controlled police | NPC pursuit is sufficient and needs no role balance pass |
| Vehicles as a driving simulation | Valet and delivery use simple constrained movement |
| A city-scale world, streaming, world partitioning | 400m x 400m needs none of it |
| Character progression stats, levels, skills | Progression is access and standing, not power |
| Voice chat, friends lists, clans | Social layer is out of MVP |
| Public deployment or store submission | Requires a fresh Owner gate per the playbook |

An agent that finds itself implementing anything in the right column should stop and raise a
ticket instead.

## 8. Content budget

| Asset class | MVP count |
| --- | --- |
| Interior spaces | 6 (floor, back room, office, bar, cage, holding) |
| Exterior blocks | 1 |
| Cosmetic items | 46 (42 shop + 4 Insignia) |
| NPC archetypes | 5 (patron, doorman, bartender, dealer, officer) |
| Casino games | 3 |
| Jobs | 4 |
| Quest stages | 6 (Q0 to Q5) plus 1 side objective |

## 9. Risk register

| ID | Risk | Impact | Mitigation |
| --- | --- | --- | --- |
| R1 | Gambling content triggers real-world legal or store-policy classification | Blocks release | Closed-loop currency, no purchase, no redemption; Owner-owned legal review remains open (D1) |
| R2 | Card counting inverts the blackjack house edge | Breaks the economy premise | Full reshuffle every round (invariant G7) |
| R3 | A currency exploit inflates the economy | Breaks all balance | Faucets/sinks enumerated; invariants I1 to I10 tested |
| R4 | Player-dealer sees hole cards early | Direct cheating vector | Hole card not replicated before reveal (G8); explicit test |
| R5 | One player permanently holds the owner seat on a 4-player server | Starves the quest payoff | Forfeiture rules; open balance question D14 |
| R6 | Reconnect mid-round double-pays or refunds a stake | Currency duplication | Idempotency keys; invariant G4/I7 |
| R7 | Unreal C++ complexity exceeds agent throughput | Schedule slip | Decision 0001 alternative (Unity) recorded and still open |
| R8 | Casino games feel like a slot-machine skinner box rather than a game | Retention | Blackjack's low edge, `STANDING` on volume not losses, quest chain as the real goal |
| R9 | Arrest hold time is dead time on a small server | Retention | Short holds; open decision D10 |
| R10 | Scope creep from "one more casino game" | Schedule | Section 7 scope fence is normative |

## 10. Acceptance criteria for this document

- Every system named in ticket 0001 scope item 6 has a normative document.
- Every economic value has a named faucet or sink.
- Every stated house edge is derived, not asserted.
- Every open product question is recorded in `open-owner-decisions.md`, not resolved here.
- No document in this surface specifies a network protocol, schema, or API shape; those
  require Decision 0001 approval and belong to the Unreal and backend surfaces.
