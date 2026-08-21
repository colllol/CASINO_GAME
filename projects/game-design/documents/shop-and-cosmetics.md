# Shop and cosmetics

- Status: Draft for Owner review
- Surface: Game design
- Ticket: `management/backlog/0001-casino-world-mvp-foundation.md`

The shop is currency sink S2. It is the only place cosmetics enter a player's inventory.

## 1. Hard rules

- Cosmetics are bought with `CASH` at a **fixed, visible price**. No randomised purchase,
  no crates, no keys, no gacha, no timed FOMO rotation in the MVP.
- Cosmetics are **cosmetic only**. No item may alter movement speed, luck, payout, heat
  gain, job pay, or any other simulation value. This is an invariant, not a guideline.
- Purchases are permanent and non-refundable. There is no resale, no salvage, and no
  player-to-player transfer (economy constraint C2).
- Cosmetics can never be wagered at a table.
- Nothing in the shop is purchasable with real money.

## 2. Slots

Six equip slots, one item each:

| Slot | Examples |
| --- | --- |
| Head | fedora, flat cap, visor, bare |
| Outerwear | tuxedo jacket, dealer vest, leather jacket, bomber |
| Shirt | dress shirt, tee, turtleneck |
| Legs | dress trousers, jeans, chinos |
| Shoes | oxfords, sneakers, boots |
| Accessory | watch, sunglasses, cigarette holder, lapel pin |

Employment roles override the Outerwear slot with a uniform while on shift. The player's
own choice returns at shift end.

## 3. Rarity and the pricing ladder

Rarity is a price and prestige tier only. It has no mechanical effect.

| Tier | Price band (`CASH`) | Count at launch | Acquisition |
| --- | --- | --- | --- |
| Common | 150 - 400 | 18 | Shop, always stocked |
| Smart | 500 - 1500 | 12 | Shop, always stocked |
| Formal | 2000 - 5000 | 8 | Shop, requires `STANDING` >= 250 |
| Exclusive | 6000 - 12000 | 4 | Shop, requires `STANDING` >= 1000 |
| Insignia | Not for sale | 4 | Hidden quest stage rewards only |

Launch total: 42 shop items plus 4 quest items.

The `STANDING` gate on the upper tiers matters economically: it means the expensive sink is
only reachable by players who have already spent time at the tables, so the sink pulls
currency from exactly the population that has the most.

Insignia items (dealer pin, manager clip, vault key fob, house signet) are the visible
proof of the hidden quest. They are the only status symbol in the game that money cannot
buy, which is what makes the quest chain worth chasing socially.

## 4. Storefront behaviour

- One tailor storefront in the shop zone, browsable by slot.
- Preview is local and free; equip is instant on purchase.
- The shop refuses service at `HEAT` tier 3 or above ("we don't want trouble in here").
  This is a deliberate second sting on heat beyond the fine, and it is listed in
  `police-and-heat.md` as a heat sink pressure.
- Purchases are server-validated: the server checks price, `STANDING` requirement, heat
  tier, and wallet balance, then debits and grants atomically in one transaction.

## 5. Invariants for implementation and test

| ID | Invariant |
| --- | --- |
| SH1 | A cosmetic grant and its `CASH` debit succeed or fail together |
| SH2 | Buying an already-owned item is rejected, not silently charged |
| SH3 | No cosmetic record carries a gameplay stat field |
| SH4 | Equipping a cosmetic produces no server-side simulation change other than appearance |
| SH5 | Insignia items cannot be obtained through the purchase path at any price |
| SH6 | Purchases are idempotent under retry |

## 6. Open Owner decisions

D8 (shop rotation policy: fixed catalogue vs. rotating stock post-MVP), D9 (whether the
`STANDING` gate on Formal/Exclusive tiers is the right pressure or feels punitive).
Recorded in `open-owner-decisions.md`.
