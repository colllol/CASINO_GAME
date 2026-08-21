# Hidden quest - the back room

- Status: Draft for Owner review
- Surface: Game design
- Ticket: `management/backlog/0001-casino-world-mvp-foundation.md`

The progression spine of the game: an undiscoverable-by-menu chain that turns a customer into
the casino's owner. This is the content that makes the loop in `gdd-casino-world-mvp.md`
section 3.3 real.

## 1. Design intent

Nothing in the UI announces this quest. There is no marker, no journal entry, and no NPC who
offers it. The player is *noticed* and then *approached*. That asymmetry is the point: the
first time a player sees another player wearing a dealer pin, the question "how did you get
that" becomes the actual quest hook. The chain is designed to be discovered socially and
transmitted by rumour on a small server.

Consequence for implementation: the trigger conditions must be reachable by ordinary play, not
by an obscure interaction. A player who works, gambles, and stays out of trouble will find it
eventually without being told.

## 2. Stage graph

```text
            +-- fails clean-record check --> back to Q1 (retryable)
            |
Q0 UNAWARE --+
   |  trigger: STANDING >= 150 AND HEAT tier 0 AND >= 2 distinct sessions
   v
Q1 NOTICED           the doorman greets you by name; a note appears in your locker
   |  action: bring the note to the bar, order the drink written on it
   v
Q2 VOUCHED           the bartender points at the staff door; it now opens for you
   |  action: run three errands for the floor (timed, low stakes)
   v
Q3 RECRUITED  ---->  ROLE: DEALER          reward: dealer pin (Insignia)
   |  action: complete 5 dealer shifts with no incident, STANDING >= 600
   v
Q4 TRUSTED    ---->  ROLE: FLOOR_MANAGER   reward: manager clip (Insignia)
   |  action: hold the floor through 10 shifts, accrue 40,000 CASH, HEAT tier 0
   v
Q5 SUCCESSOR  ---->  ROLE: OWNER           reward: house signet (Insignia)
        buyout: 250,000 CASH paid to the NPC house
```

The vault key fob (fourth Insignia item) is awarded at Q4 for a side objective, not on the
critical path; see section 6.

## 3. Stage detail

### Q0 -> Q1: being noticed

Trigger, all three required:

- `STANDING` >= 150 (accrued from wagered volume, so about 1500 chips wagered)
- `HEAT` tier 0 at the moment of evaluation
- at least 2 distinct login sessions, so it cannot be rushed in one sitting

Evaluated server-side on entering the casino. On trigger, the doorman uses the player's name
in his greeting line and a sealed note is placed in the player's locker. No quest UI appears.

The two-session requirement is deliberate: it guarantees the persistence layer is exercised
before the quest chain begins, and it makes "come back tomorrow" part of the fiction.

### Q1 -> Q2: the vouching

The note names a drink. The player must order that exact drink at the bar. Ordering the wrong
drink is not a failure; the bartender simply serves it. This is the only puzzle in the chain
and it is a reading-comprehension check, not a riddle.

On the correct order, the bartender's dialogue changes and the **staff door** transitions from
locked to player-openable. The door state is per-player and server-authoritative.

### Q2 -> Q3: the errands

Three timed errands inside the casino, each 60 to 120 seconds:

1. Carry a cash box from the cage to the manager's office without being seen loitering.
2. Deliver a sealed envelope to a specific NPC patron at a table.
3. Cover a bar shift (reuses job J3) during a rush.

Each errand pays 500 to 800 `CASH` (faucet F5). Failing one is retryable with a 5-minute
cooldown; there is no permanent failure state anywhere in this chain.

Completion grants the `DEALER` role, the dealer pin, and 2500 `CASH`.

### Q3 -> Q4: proving out

Requirements:

- 5 completed dealer shifts (10 rounds each) with no incident
- `STANDING` >= 600
- `HEAT` tier 0

"No incident" means: no shift abandoned mid-round, no wager attempted at own table (the server
rejects these, and a rejection counts as an incident), no heat interlock triggered during a
shift.

Grants `FLOOR_MANAGER`, the manager clip, and 5000 `CASH`.

### Q4 -> Q5: the buyout

Requirements:

- 10 shifts held as floor manager
- 250,000 `CASH` on hand for the buyout
- `HEAT` tier 0 and no outstanding debt
- the owner seat is vacant, or the player enters `SUCCESSOR` and waits (see section 5)

The buyout **destroys** 250,000 `CASH` (it is paid to the NPC house, which is not a wallet).
This is the single largest sink in the game and it is the intended endgame money drain. It is
recorded as sink S7 in `economy-closed-loop.md`.

Grants `OWNER`, the house signet. No cash reward; ownership *is* the reward, and it comes
with upkeep sink S5 from the next real-time day.

## 4. Time-to-complete estimate

| Stage | Est. active play |
| --- | --- |
| Q0 -> Q1 | 1 to 2 hours across 2+ sessions |
| Q1 -> Q2 | 10 minutes |
| Q2 -> Q3 | 20 minutes |
| Q3 -> Q4 | 2 to 3 hours |
| Q4 -> Q5 | 4 to 8 hours, dominated by earning 250,000 `CASH` |
| **Total** | **~8 to 14 hours** |

The tail is intentionally long and is gated by money rather than by content, so it scales with
whatever earn rate balance testing settles on. If the Owner wants a shorter MVP demo path,
lowering the buyout is the single dial to turn; recorded as decision D13.

## 5. Multiplayer contention and the SUCCESSOR state

One `OWNER` and one `FLOOR_MANAGER` per server. A player who meets every Q5 requirement while
the seat is occupied becomes `SUCCESSOR`: fully qualified, waiting. Their 250,000 `CASH` is
**not** taken until the seat is actually granted.

The seat vacates when the incumbent forfeits (unpaid upkeep, or heat tier 4 forfeiture clock)
or is offline past the retention window. Owner decision D5 sets that window.

`DEALER` is capped at 3 concurrent and is not scarce enough to need a queue.

Design risk worth naming: on a four-player server, one player permanently holding the owner
seat starves the chain's payoff for everyone else. The forfeiture rules exist to make the seat
lose-able, but whether they are aggressive enough is an open balance question (D14).

## 6. Side objective: the vault

Not on the critical path. At Q4 the manager's office contains a vault whose combination is
split across three findable notes in the world (depot office, valet stand, bar back). Assembling
all three grants the **vault key fob** and a one-time 10,000 `CASH` reward.

This exists to give the chain a discoverable secret that does not gate progression, so a player
who prefers exploration to shift work still has something to find.

## 7. Failure and reversibility

- No stage is permanently failable. Every requirement is retryable.
- Heat can push a player *out* of qualification temporarily but never out of a completed stage.
  Completed stages are permanent; only roles are revocable.
- Role loss (`OWNER` -> `FLOOR_MANAGER` on forfeiture) does not reset quest stages. The player
  keeps their Insignia items and can re-buy the seat, though the 250,000 `CASH` must be earned
  again.

## 8. Invariants for implementation and test

Invariants use the `HQ` prefix so they cannot be confused with the quest stage IDs `Q0` to `Q5`.

| ID | Invariant |
| --- | --- |
| HQ1 | Quest stage transitions are evaluated and written server-side only |
| HQ2 | Stage progress persists across disconnect and across sessions |
| HQ3 | A stage reward is granted exactly once per player, idempotent under retry |
| HQ4 | Completed stages are never rolled back by heat, debt, or role loss |
| HQ5 | At most one `OWNER` and one `FLOOR_MANAGER` exist per server at any instant |
| HQ6 | The Q5 buyout debits 250,000 `CASH` and credits no wallet |
| HQ7 | `SUCCESSOR` does not debit the buyout until the seat is granted |
| HQ8 | Insignia items are grantable only by quest stage completion (shop invariant SH5) |
| HQ9 | The staff door's openable state is per-player and server-authoritative, not a client flag |

HQ5 is the hardest one to test and needs a concurrency test with two players completing Q5
requirements simultaneously.

## 9. Open Owner decisions

D5 (role succession window), D13 (buyout cost / MVP demo path length), D14 (owner forfeiture
aggressiveness), D15 (whether the chain should be discoverable by a second, faster path for
players who join late). Recorded in `open-owner-decisions.md`.
