# Open Owner decisions - game design surface

- Status: Register, updated as decisions resolve
- Surface: Game design
- Ticket: `management/backlog/0001-casino-world-mvp-foundation.md`

Per `AGENTS.md`, design agents may not settle product or economy questions. Each row below is
a question this surface deliberately left open. `Recommendation` is the design surface's
suggested default so the Owner can approve in bulk rather than answer fifteen questions from
scratch.

Nothing here blocks Phase 0 documentation. Items marked **Blocks Phase 4** must resolve before
the economy/jobs/quest implementation phase begins.

| ID | Question | Recommendation | Blocks | Raised in |
| --- | --- | --- | --- | --- |
| D1 | Legal classification of simulated gambling with closed-loop virtual currency in target markets and app stores | Obtain professional legal review before any public build; keep C1-C3 as the working constraint meanwhile | Release | `gdd-casino-world-mvp.md` R1 |
| D2 | Are the house edge targets right: slots 5.175%, roulette 2.7027%, blackjack ~0.55% vs basic strategy | Approve as-is; they are real-casino-plausible and mathematically verified | Phase 4 | `economy-closed-loop.md` 5 |
| D3 | Should crime income be at rough parity with legal work after expected fines, or clearly worse | Rough parity with higher variance; crime should feel faster, not better | Phase 4 | `jobs-and-employment.md` 3 |
| D4 | Dealer 5% and floor manager 10% margin share percentages | Approve as starting values, revisit after balance testing | Phase 4 | `jobs-and-employment.md` 4 |
| D5 | Retention window before a logged-off `OWNER` or `FLOOR_MANAGER` seat becomes claimable | 48 real-time hours offline, or immediate on upkeep forfeiture | Phase 4 | `jobs-and-employment.md` 5 |
| D6 | Confirm no player-to-player currency or item transfer in the MVP | Confirm the ban; it removes the entire RMT and farming surface for near-zero design cost | Phase 2 (contract) | `economy-closed-loop.md` C2 |
| D7 | Does `HEAT` decay while a player is offline | Yes, at 1 per 10 minutes offline, capped so a session always starts below tier 4 | Phase 4 | `police-and-heat.md` 4 |
| D8 | Fixed cosmetic catalogue, or rotating stock after MVP | Fixed for MVP; rotation is a live-service pattern with no MVP value | Post-MVP | `shop-and-cosmetics.md` 6 |
| D9 | Is the `STANDING` gate on Formal/Exclusive cosmetics good pressure or punitive | Keep it; it aims the largest sink at the wealthiest players | Phase 4 | `shop-and-cosmetics.md` 6 |
| D10 | Arrest hold durations (60-180s) versus dead-time retention risk on a 4-player server | Shorten to 30-90s and let the fine carry the punishment | Phase 4 | `police-and-heat.md` 9 |
| D11 | Blackjack: full reshuffle every round (guarantees the sink) versus shoe realism (allows counting) | Reshuffle every round; a provably closed economy outranks realism | Phase 4 | `casino-games-mvp.md` 5.2 |
| D12 | Slot max bet capped at 100 `CHIPS` while table max is 2500, because of the 1500x top prize | Approve the cap, or lower the top prize and raise the cap; do not do neither | Phase 4 | `casino-games-mvp.md` 3.3 |
| D13 | Q5 buyout cost of 250,000 `CASH` (~4-8h of earning) | Approve for the real game; provide a debug-only lowered value for demos | Phase 4 | `hidden-quest-back-room.md` 4 |
| D14 | Is owner-seat forfeiture aggressive enough to keep the endgame reachable for others | Add a soft cap: voluntary or forced rotation after N days held | Phase 4 | `hidden-quest-back-room.md` 5 |
| D15 | Should late-joining players get a faster second path into the quest chain | No for MVP; the chain being slow is what makes the Insignia items mean something | Post-MVP | `hidden-quest-back-room.md` 9 |
| D16 | Confirm Decision 0001 (Unreal 5 + C++ + dedicated server + EOS + Postgres/TypeScript) | Owner gate already open; design surface has no preference beyond needing server authority | Phase 1 | `management/decisions/0001-engine-and-service-stack.md` |

## Decisions this surface did NOT make and will not

- Network protocol, replication strategy, or tick rate: Unreal surface, after D16.
- Schema, API shape, or persistence technology: backend surface, after D16.
- Test framework choice or CI topology: QA/ops surface.
- Anything in the `gdd-casino-world-mvp.md` section 7 out-of-scope table.

## How to resolve

Record the Owner's answer either inline in this table (changing `Blocks` to `Resolved
YYYY-MM-DD`) or, for anything with contract or monetization impact, as a new record in
`management/decisions/`. Per the PM playbook, D1 and D6 are the two that most clearly warrant
their own decision records rather than a table row.
