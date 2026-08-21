# Jobs and casino employment

- Status: Draft for Owner review
- Surface: Game design
- Ticket: `management/backlog/0001-casino-world-mvp-foundation.md`;
  Phase 1 revision under `management/backlog/0003-phase1-rules-and-local-backend-contract.md`

Jobs are the economy's faucets (F1 to F4 in `economy-closed-loop.md`). This document
defines the shared job framework and the MVP job set.

## 1. Job framework

A job is a repeatable, server-arbitrated activity with this lifecycle:

```text
AVAILABLE -> ACCEPTED -> IN_PROGRESS -> (COMPLETED | FAILED | ABANDONED)
```

Rules that apply to every job:

- A player holds at most one active job at a time.
- The server owns the state machine. The client sends intent (accept, deliver, serve); the
  server validates position, timing, and prerequisites before crediting anything.
- Payout is credited once, on `COMPLETED`, with an idempotency key of
  `jobInstanceId + playerId`. A reconnect mid-job resumes the instance rather than
  restarting it.
- `ABANDONED` on disconnect after a 90-second grace window. No partial pay.
- Each job has a per-player cooldown to stop single-job farming loops.

## 2. Legal jobs (MVP: three)

### J1 - Delivery driver

- **Where:** delivery depot, street block.
- **Loop:** collect a parcel, drive or walk it to a marked drop, return for the next.
- **Duration:** 3 to 4 minutes for a 3-drop route.
- **Payout:** 240 `CASH` base, +40 per drop delivered inside the soft timer.
- **Cooldown:** none; this is the reliable baseline earner.
- **Failure:** timer expiry pays base only. Parcel is never destroyed.

### J2 - Valet

- **Where:** casino entrance valet stand.
- **Loop:** a vehicle arrives, park it in a numbered bay, retrieve it when the ticket is
  called. Serves double duty as the reason players learn the casino frontage.
- **Duration:** 2 to 3 minutes per cycle.
- **Payout:** 220 `CASH` per completed cycle. Damage-free parking adds 60 `CASH`.
- **Cooldown:** 60 seconds.
- **Notes:** the only job with a visible quality metric, which makes it the natural place
  to seed the first hidden-quest observation (see `hidden-quest-back-room.md`).

### J3 - Bar service

- **Where:** casino bar.
- **Loop:** take an order from an NPC or player patron, mix from a 3-step recipe, deliver.
- **Duration:** 45 to 90 seconds per order, shifts of 5 orders.
- **Payout:** 300 `CASH` per shift, +20 per correct recipe, -0 for a wrong one (the order
  is simply refused and retried).
- **Cooldown:** 120 seconds between shifts.
- **Notes:** puts a low-level employee inside the casino, which is where `STANDING`
  observation happens.

## 3. Crime earner (MVP: one)

### J4 - Warehouse job

- **Where:** alley door behind the street block.
- **Loop:** pick the lock (timing mini-game), grab 1 to 3 crates, reach the fence drop
  without being caught by the patrol.
- **Duration:** 2 to 5 minutes.
- **Payout:** 400 `CASH` per crate, so 400 to 900 for a normal run.
- **Heat:** +1 tier on the lock pick being noticed, +1 more per crate carried past a
  patrol sightline. See `police-and-heat.md`.
- **Failure:** arrest transfers the player to the police station, voids the payout, and
  applies the fine for the current heat tier.
- **Cooldown:** 5 minutes per player.

Crime pays roughly 1.6x per minute versus J1 but the expected fine plus casino lockout
brings effective value close to parity. Owner decision D3 covers whether that parity is
the right target.

## 4. Casino employment

Casino jobs are not available from the job board. They are unlocked only through the hidden
quest chain and are represented by an employment role on the character.

### Role: DEALER

- **Unlocked by:** completing hidden quest stage Q3.
- **Duty:** operate one blackjack or roulette table for a shift of 10 rounds, dealing to
  real players when present and NPC patrons when not.
- **Pay:** 350 `CASH` per shift plus 5% of the table's house margin for that shift, drawn
  from `houseMarginAccrued` (not a new faucet).
- **Constraint:** a dealer cannot wager at their own table during a shift. The server
  rejects the bet rather than the UI hiding it.
- **Shift end:** the table reverts to NPC dealer operation.

### Role: FLOOR_MANAGER

- **Unlocked by:** completing hidden quest stage Q4.
- **Duty:** assign dealers to tables, set table minimum bets within a bounded range,
  resolve flagged incidents.
- **Pay:** 600 `CASH` per shift plus 10% revenue share from `houseMarginAccrued`.
- **Constraint:** cannot set a table minimum outside the Owner-approved band, and cannot
  alter paytables or house edge. House edge is not a player-facing dial in the MVP.

### Role: OWNER

- **Unlocked by:** completing hidden quest stage Q5.
- **Duty:** hire and fire the dealer roster, set opening hours, pay upkeep (sink S5).
- **Pay:** draw from `houseMarginAccrued`, capped at the accrued balance (invariant I8).
- **Risk:** unpaid upkeep for two consecutive real-time days forfeits ownership back to
  the NPC house and returns the player to `FLOOR_MANAGER`.

## 5. Multiplayer contention

The MVP supports ten concurrent players, so contention is real:

- J1 and J4 instance per player; no contention.
- J2 and J3 have a shared station with 2 slots each; a full station shows a short queue. At
  ten players a two-slot station is the tightest bottleneck in the game and the queue length
  is a balance measurement, not an assumption.
- There is exactly **one** `FLOOR_MANAGER` and **one** `OWNER` per server at a time. If a
  second player completes Q5 while the seat is held, they enter a `SUCCESSOR` state and take
  the seat when it is vacated by forfeit or logout beyond the retention window. Owner
  decision D5 covers the retention window length.
- Up to 3 concurrent `DEALER` roles (one per table plus one relief).

Job routes run through `HOSTILE` zones, so a player carrying job earnings is a robbery target
on the way back. J1 in particular crosses the street block repeatedly. That is intended
pressure and it is the reason the cage accepts deposits: the counterplay is to bank between
runs, not to avoid the job.

## 6. Anti-exploit notes

- Payouts validate player position server-side at the moment of completion, so teleport or
  speed manipulation cannot compress a route.
- Job cooldowns are stored per-player server-side and survive reconnect.
- Dealer margin share is computed from settled rounds only, so a dealer cannot inflate it
  by dealing to a colluding partner: collusion still requires real losses to generate margin,
  and there is no voluntary player-to-player transfer to recover them (economy constraint C2).
  Robbery does not reopen this: it is involuntary, arbitrated by a state machine, and costs the
  robber heat, so it cannot be used as a settlement channel between colluding accounts. See
  `robbery-and-pvp.md` section 5.
- Active job items (parcels, the cash box, the envelope) are bound to their `jobInstanceId`
  and are `PROTECTED` from robbery, so a robbery can never break job payout idempotency.
- A player on a casino employment shift cannot initiate a robbery (invariant RB15), which
  stops a dealer from stepping outside mid-shift to rob a departing winner.

## 7. Open Owner decisions

D3 (crime income parity), D4 (dealer margin share percentages), D5 (role succession
window). Recorded in `open-owner-decisions.md`.
