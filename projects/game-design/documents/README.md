# Game design surface

Owns the GDD, player loops, economy constraints, jobs, casino rules, hidden quests, crime,
progression, and content acceptance criteria. It does not define network or persistence
contracts without an approved decision record.

## Documents

Start with the GDD; it is the entry point and links onward. Where a summary in the GDD
disagrees with a system document, the system document is normative.

| Document | Contents |
| --- | --- |
| [gdd-casino-world-mvp.md](gdd-casino-world-mvp.md) | Concept, pillars, player loop, world, MVP scope fence, risk register |
| [economy-closed-loop.md](economy-closed-loop.md) | Currencies, the exhaustive faucet and sink lists, house edge, invariants |
| [jobs-and-employment.md](jobs-and-employment.md) | Job framework, 3 legal jobs, 1 crime job, dealer/manager/owner roles |
| [casino-games-mvp.md](casino-games-mvp.md) | Slots, roulette, blackjack: rules, paytables, derived RTP, round phases |
| [shop-and-cosmetics.md](shop-and-cosmetics.md) | Equip slots, rarity tiers, pricing ladder, cosmetic-only guarantees |
| [hidden-quest-back-room.md](hidden-quest-back-room.md) | The Q0-Q5 chain from customer to casino owner |
| [police-and-heat.md](police-and-heat.md) | Heat tiers, gains, decay, pursuit, arrest, casino interlocks |
| [open-owner-decisions.md](open-owner-decisions.md) | D1-D16: questions this surface deliberately left to the Owner |
| [verification-notes.md](verification-notes.md) | What Phase 0 verified, and the test obligations these documents impose |

All of the above are Draft for Owner review. Proposed economy decision record:
`management/decisions/0002-mvp-economy-and-house-edge.md`.
