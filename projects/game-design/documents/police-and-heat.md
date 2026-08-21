# Police and heat

- Status: Draft for Owner review
- Surface: Game design
- Ticket: `management/backlog/0001-casino-world-mvp-foundation.md`;
  Phase 1 revision under `management/backlog/0003-phase1-rules-and-local-backend-contract.md`

`HEAT` is the toll on crime. It is a persisted, decaying meter that converts illegal income
into lost access.

## 1. Why heat is priced in access, not damage

There is no combat in the MVP, so heat cannot be punished with death or gear loss. Instead
it is punished with the thing the player actually wants: the casino door. A high-heat player
has money and nowhere to spend it, which is a far better pressure than a health bar and
costs no netcode.

## 2. Heat tiers

`HEAT` is an integer 0 to 100, bucketed into five tiers.

| Tier | Heat | Label | Police behaviour | Casino door | Shop | Fine (sink S3) |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 0-9 | Clean | Ignore | Open | Open | - |
| 1 | 10-29 | Noticed | Patrols glance, no pursuit | Open | Open | 200 |
| 2 | 30-54 | Suspected | Patrols approach and question | Open, doorman comments | Open | 600 |
| 3 | 55-79 | Wanted | Active pursuit on sight | **Refused** | **Refused** | 1500 |
| 4 | 80-100 | Hunted | Pursuit plus station lockdown at arrest | **Refused** | **Refused** | 3500 |

Tier 3 is the design centre of gravity: it is where a profitable crime run stops being
profitable, because the currency earned cannot be converted into chips or cosmetics.

## 3. Heat gains

| Event | Heat |
| --- | --- |
| Lock pick observed by an NPC or patrol | +12 |
| Carrying a stolen crate through a patrol sightline | +10 per sighting |
| Fleeing a questioning patrol | +15 |
| Completing warehouse job J4 undetected | +8 (the fence talks) |
| Arrest resisted (running from an arrest prompt) | +20 |
| Bribing an officer (sink S4) | +5 suspicion after the clear |
| Initiating a robbery (attempt, whether or not it succeeds) | +8 |
| Completing a robbery, victim report only, no witness | +14 |
| Completing a robbery witnessed by a patrol | +25 instead of the +14 |

Heat is applied server-side from server-observed events. A client never reports its own
detection state.

### 3.1 Robbery always costs heat

A robbery has a witness by definition: the victim. They file a report, so the "clean
robbery" does not exist and there is no stealth build that avoids the toll. A patrol seeing it
happen is materially worse than the report alone, which gives robbers a real reason to prefer
alleys over the main street and gives the district's patrol routes a gameplay purpose beyond
the warehouse job.

The heat values above are MVP starting points for balance testing in the same sense as every
other number in this document. Phase 1 transfers all carried cash; post-MVP robbery balance
tuning is recorded in `robbery-and-pvp.md` section 6.

A failed robbery attempt still costs the initiator heat. Otherwise probing for an unbanked
target would be free, and the correct strategy would be to attempt a robbery on everyone you
walk past.

## 4. Heat loss

| Path | Effect | Cost |
| --- | --- | --- |
| Passive decay | -1 per 90 seconds of active play | Free, slow |
| Pay fine at booking desk | Drops to tier 0 | Fine for current tier (S3) |
| Bribe a patrol | Drops one tier immediately | 2x equivalent fine (S4), +5 heat suspicion |
| Serve time after arrest | Drops to tier 0 | 60 to 180 seconds held, by tier |
| Offline decay | Owner decision D7, see below | - |

Paying the fine is deliberately the cheapest full reset. Bribing is a trap option: it is
faster, more expensive, and leaves residue. Presenting an obviously worse "convenient"
option is how the design teaches that crime compounds.

## 5. Pursuit

Pursuit is NPC-only in the MVP. No player plays as police.

- Two patrol officers walk fixed routes on the street block; one static officer is at the
  casino entrance and does not pursue.
- At tier 3+ an officer that gains line of sight for 1.5 continuous seconds enters pursuit.
- Pursuit is a chase-and-tag: an officer within 2m for 1 continuous second triggers an
  arrest prompt. There is no gunfire.
- Escape condition: no officer has line of sight for 20 continuous seconds. Escape does not
  reduce heat.
- Interiors: officers will follow into the casino lobby but not into the back area or the
  bar. This gives the player a readable safe pocket without making the casino a heat laundry,
  because the door check already refused entry at tier 3.

Pursuit state is server-authoritative and replicated. A disconnect during pursuit resolves
as an arrest after the 90-second grace window, so logging off is not an escape.

### 5.1 The PvP safe zone is not a police safe zone

Two separate systems share the casino building and must not be conflated:

| System | Casino interior |
| --- | --- |
| Robbery / PvP (`robbery-and-pvp.md`) | `SAFE`: no player can be robbed there, ever |
| Police pursuit (this document) | Not safe: officers follow into the lobby, and the door check already refused entry at tier 3 |

So a robber cannot escape the police by reaching the casino, because at the heat a robbery
generates the doorman refuses them at the entrance. They can escape *another player* there,
which is exactly the intended asymmetry: the casino protects your cash from players and
exposes your record to the law.

## 6. Arrest

On arrest the server:

1. Voids any in-progress crime job payout (`FAILED`, no partial pay).
2. Confiscates carried contraband (crates), which are destroyed, not banked.
3. Applies the fine for the current tier as an **outstanding debt** if the wallet cannot
   cover it. Wallets never go negative (economy invariant I2).
4. Teleports the player to the police station holding area for the tier's hold duration.
5. Sets heat to 0 on release.

Outstanding debt blocks chip purchase at the cage until cleared. This closes the loophole
where a broke player would rather be arrested than pay.

Arrest does **not** confiscate carried or banked `CASH`, including cash taken in a robbery.
Only contraband is destroyed. This keeps robbery a clean redistribution in the ledger
(economy invariant I5 and section 6.2) and keeps the fine as the punishment, rather than
introducing a second, silent, variable-size sink that would be invisible in balance testing.

## 7. Casino interlocks

| Interlock | Rule |
| --- | --- |
| Door check | Entry refused at tier 3+ |
| Cage | Chip purchase refused at tier 2+ and while debt is outstanding |
| Employment | A shift cannot be started at tier 1+; an on-shift player reaching tier 2 is sent home and forfeits the shift bonus |
| Ownership | Reaching tier 4 as `OWNER` starts a 1-real-day forfeiture clock |
| Robbery | A player on any casino employment shift cannot initiate a robbery (invariant RB15) |

The employment interlock is the strongest one and it is intentional: the hidden quest's
whole premise is that the casino is buying a clean, trustworthy face. A player cannot be
both the district's most wanted and the house's floor manager.

## 8. Invariants for implementation and test

| ID | Invariant |
| --- | --- |
| H1 | All heat mutations originate server-side from server-observed events |
| H2 | Heat is clamped to 0..100 |
| H3 | Heat, outstanding debt, and pursuit state persist across disconnect and reconnect |
| H4 | Disconnect during pursuit resolves as arrest after the grace window, never as escape |
| H5 | Arrest destroys contraband; it is never credited to any wallet |
| H6 | Interlock checks are enforced server-side, not by hiding UI |
| H7 | Outstanding debt blocks the cage until cleared |
| H8 | Every heat mutation writes an append-only authoritative event naming the server-observed cause |
| H9 | A robbery attempt applies heat to the initiator whether it succeeds or fails |
| H10 | Arrest never confiscates `CASH`, carried or banked |
| H11 | The PvP `SAFE` classification never suppresses police pursuit, and pursuit never enables robbery inside a `SAFE` volume |

## 9. Open Owner decisions

D7 (offline heat decay: none, slow, or full reset), D10 (arrest hold durations; dead time
is a retention risk on a small server), and post-MVP robbery balance tuning. Recorded in
`open-owner-decisions.md`.
