# Open Owner decisions - game design surface

- Status: Register, updated as decisions resolve
- Surface: Game design
- Ticket: `management/backlog/0001-casino-world-mvp-foundation.md`;
  Phase 1 additions under `management/backlog/0003-phase1-rules-and-local-backend-contract.md`

Per `AGENTS.md`, design agents may not settle product or economy questions. Each row below is
a question this surface deliberately left open. `Recommendation` is the design surface's
suggested default so the Owner can approve in bulk rather than answer fifteen questions from
scratch.

Nothing here blocks documentation. Items marked **Blocks Phase 1** must resolve before the
system they name can be switched on, and the servers for those systems are specified to refuse
to start rather than to guess a default. Items marked **Blocks Phase 4** must resolve before
the economy/jobs/quest implementation phase begins.

D17 through D25 were added in Phase 1 by ticket 0003. D17 and D22 are the two that a
verification pass cannot work around: they are the loss percentages and odds this surface is
forbidden to invent.

| ID | Question | Recommendation | Blocks | Raised in |
| --- | --- | --- | --- | --- |
| D1 | Legal classification of simulated gambling with closed-loop virtual currency in target markets and app stores | Obtain professional legal review before any public build; keep C1-C3 as the working constraint meanwhile | Release | `gdd-casino-world-mvp.md` R1 |
| D2 | Are the house edge targets right: slots 5.175%, roulette 2.7027%, blackjack ~0.55% vs basic strategy | Approve as-is; they are real-casino-plausible and mathematically verified | Phase 4 | `economy-closed-loop.md` 5 |
| D3 | Should crime income be at rough parity with legal work after expected fines, or clearly worse | Rough parity with higher variance; crime should feel faster, not better | Phase 4 | `jobs-and-employment.md` 3 |
| D4 | Dealer 5% and floor manager 10% margin share percentages | Approve as starting values, revisit after balance testing | Phase 4 | `jobs-and-employment.md` 4 |
| D5 | Retention window before a logged-off `OWNER` or `FLOOR_MANAGER` seat becomes claimable | 48 real-time hours offline, or immediate on upkeep forfeiture | Phase 4 | `jobs-and-employment.md` 5 |
| D6 | Confirm no **voluntary** player-to-player currency or item transfer in the MVP, with robbery as the sole involuntary path | Confirm the ban on voluntary transfer; it removes the RMT and farming surface, and robbery does not reopen it because neither party can guarantee delivery | Phase 2 (contract) | `economy-closed-loop.md` C2 |
| D7 | Does `HEAT` decay while a player is offline | Yes, at 1 per 10 minutes offline, capped so a session always starts below tier 4 | Phase 4 | `police-and-heat.md` 4 |
| D8 | Fixed cosmetic catalogue, or rotating stock after MVP | Fixed for MVP; rotation is a live-service pattern with no MVP value | Post-MVP | `shop-and-cosmetics.md` 6 |
| D9 | Is the `STANDING` gate on Formal/Exclusive cosmetics good pressure or punitive | Keep it; it aims the largest sink at the wealthiest players | Phase 4 | `shop-and-cosmetics.md` 6 |
| D10 | Arrest hold durations (60-180s) versus dead-time retention risk | Shorten to 30-90s and let the fine carry the punishment | Phase 4 | `police-and-heat.md` 9 |
| D11 | Blackjack: full reshuffle every round (guarantees the sink) versus shoe realism (allows counting) | Reshuffle every round; a provably closed economy outranks realism | Phase 4 | `casino-games-mvp.md` 5.2 |
| D12 | Slot max bet capped at 100 `CHIPS` while table max is 2500, because of the 1500x top prize | Approve the cap, or lower the top prize and raise the cap; do not do neither | Phase 4 | `casino-games-mvp.md` 3.3 |
| D13 | Q5 buyout cost of 250,000 `CASH` (~4-8h of earning) | Approve for the real game; provide a debug-only lowered value for demos | Phase 4 | `hidden-quest-back-room.md` 4 |
| D14 | Is owner-seat forfeiture aggressive enough to keep the endgame reachable for others | Add a soft cap: voluntary or forced rotation after N days held | Phase 4 | `hidden-quest-back-room.md` 5 |
| D15 | Should late-joining players get a faster second path into the quest chain | No for MVP; the chain being slow is what makes the Insignia items mean something | Post-MVP | `hidden-quest-back-room.md` 9 |
| D16 | Confirm Decision 0001 (Unreal 5 + C++ + dedicated server + EOS + Postgres/TypeScript) | Owner gate already open; design surface has no preference beyond needing server authority | Phase 1 | `management/decisions/0001-engine-and-service-stack.md` |
| D17 | What share of a victim's carried `CASH` does a robbery take, and is there an absolute per-robbery cap | **No recommendation offered.** This is a loss percentage and this surface is not permitted to invent one. The mechanism is built parameterised and the server refuses to enable robbery until a value is set | Blocks Phase 1 (robbery) | `robbery-and-pvp.md` 6 |
| D18 | Per-aggressor cooldown between robberies | A cooldown should exist so robbery is a choice rather than a rotation; the duration is a balance value the Owner should set alongside D17 | Blocks Phase 1 (robbery) | `robbery-and-pvp.md` 6 |
| D19 | Non-lethal subdual, or lethal PvP combat with weapons and damage | Non-lethal. It delivers the requested conflict without putting hit registration and combat prediction on the critical path, and it keeps losses bounded to carried cash | Phase 1 | `robbery-and-pvp.md` 4.1 |
| D20 | Should a hard cap on `CASH.carried` exist, forcing deposits above a threshold | No cap. The banking decision is more interesting than a rule that makes it for the player | Phase 4 | `robbery-and-pvp.md` 6 |
| D21 | Amend economy constraint C2 from "no player-to-player transfer" to "no **voluntary** transfer, robbery excepted" | Approve the amendment; it is the minimum change that admits robbery, and the safety argument rests on the voluntary/involuntary distinction rather than on transfer volume | Blocks Phase 1 (robbery) | `economy-closed-loop.md` C2 |
| D22 | Jackpot machine outcome space, paytable, hit odds, pool contribution share, seed, and fixed stake | **No recommendation offered.** These are odds and this surface is not permitted to invent them. The only commitment made is that total RTP including the contribution must be strictly below 100% and must be derived by exhaustive enumeration, not asserted | Blocks Phase 1 (jackpot) | `casino-games-mvp.md` 6.3 |
| D23 | Confirm ten concurrent players as the MVP target, replacing the Phase 0 figure of four | Confirm ten. It is what makes robbery encounters happen at all, and the cost is a job-station queue and a replication budget to measure | Phase 1 | `gdd-casino-world-mvp.md` 5 |
| D24 | Confirm Windows-only for the MVP: Windows client and Windows dedicated server, no Linux target | Confirm. One build target for the phase whose job is proving the rules; the persistence adapter is designed so adding Linux later touches no gameplay code | Phase 1 | `gdd-casino-world-mvp.md` 5 |
| D25 | Confirm a local, versioned, file-backed persistence adapter for Phase 1, with the TypeScript/PostgreSQL service deferred until Decision 0001 is approved | Confirm. It unblocks reconnect and persistence work now behind an interface narrow enough that swapping the implementation is a backend-only change | Phase 1 | `projects/backend/documents/local-profile-persistence-adapter.md` |

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
