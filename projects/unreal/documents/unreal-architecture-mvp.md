# Unreal Architecture - Casino World MVP

- Status: Draft for Owner review
- Surface: Unreal
- Ticket: `management/backlog/0001-casino-world-mvp-foundation.md`
- Phase: 0
- Related decision: `management/decisions/0001-engine-and-service-stack.md` (proposed)

This document defines the Unreal boundary for the offline prototype and the four-player
authoritative-server vertical slice. It is an implementation contract for the Unreal
surface, not a claim that the engine or service stack has been approved.

## 1. Project shape and runtime targets

The project should use one Unreal project and one game module, with server-safe code
compiled into both client and server binaries. Suggested layout:

```text
Source/CasinoWorld/
  CasinoWorld.Build.cs
  Core/             # game instance, logging, feature flags, shared value types
  Characters/       # pawn, movement, interaction traces
  Casino/           # table state, bets, hands, roulette/slots adapters
  Jobs/             # job state and server-issued objectives
  Quests/           # quest progression events and requirements
  Crime/            # heat and pursuit state
  World/            # district, interactables, travel and ownership
  Net/              # replicated components, RPC validation, reconnect hooks
  UI/               # UMG-facing view models and presentation-only helpers
Content/
  Maps/             # persistent district plus test maps
  Blueprints/       # pawn, table, interactable and UI composition
  Data/             # DataAssets/DataTables for tunable content
  Art/              # source-linked meshes, materials, animation and audio
Config/
  DefaultEngine.ini
  DefaultGame.ini
  DefaultEditorPerProjectUserSettings.ini
Tests/
  Functional/       # automation specs that run in editor and server contexts
  Multiplayer/      # launch/configuration fixtures and scenario data
```

Phase 1 build targets are `CasinoWorldEditor` for authoring/automation and
`CasinoWorldServer` as a dedicated server. A packaged client target is required for the
vertical slice; its name should remain the Unreal-generated `CasinoWorld` target unless
the Owner approves a separate launcher. Development and Shipping configurations must be
built independently, with symbols retained for Development test failures.

The initial map should be a small persistent district containing one casino interior,
one job location and a test travel boundary. Keep world partition/data-layer usage
optional until the district size needs streaming; do not make it a prerequisite for the
four-player slice.

## 2. C++ and Blueprint boundary

### C++ owns

- authoritative state machines and all mutations of currency, inventory, rewards,
  casino outcomes, quest state, heat and casino ownership;
- replicated properties, server RPCs, validation, rate limits and idempotency keys;
- deterministic game rules and random-number generation through a server-only source;
- persistence request/response adapters and reconnect hydration (the backend contract is
  owned by the backend surface);
- movement/interaction rules that affect collision, reachability or gameplay outcomes;
- automation-test seams and structured logs with player/session/correlation identifiers.

### Blueprint and data assets own

- actor composition, animation graphs, materials, VFX, audio and UMG presentation;
- designer-authored table layouts, interaction prompts, camera rigs and authored quest
  sequences that call typed C++ interfaces;
- tunable content values in DataAssets/DataTables. These are inputs to C++ validation,
  never an authority bypass. Server loads the same versioned data as clients and rejects
  unsupported content revisions during session admission.

Blueprints must not directly modify replicated economy or progression fields, call a
client-only random source for outcomes, or treat UI state as proof of a completed action.
Every presentation action goes through a C++ command/query interface and receives a
server result event. C++ classes should expose narrow `UFUNCTION`/`UPROPERTY` surfaces,
with `EditDefaultsOnly` for tuning and `BlueprintReadOnly` for observed state.

## 3. Dedicated-server topology and authority

For the MVP, use one dedicated server process per session and up to four player clients:

```text
EOS identity/session (proposed)
             |
        session join
             v
  Client A ... Client D  <---->  CasinoWorldServer  <---->  persistence service (proposed)
  input + view                  replication + rules       profile/inventory/ledger
```

The dedicated server owns the world, player session records, all gameplay timers and
the authoritative random stream. Clients send intent (move, interact, place bet, accept
job, submit quest action); clients never send a resulting balance, payout, hand, heat or
ownership value. The server validates actor/session ownership, distance and phase,
deduplicates the request ID, applies the transaction, writes an audit/ledger event, then
replicates the resulting view state.

Replication guidance:

- `AGameStateBase`/replicated subsystems: session phase, content revision, table roster,
  server time and reconnect-safe world markers;
- `APlayerState`: stable player ID, display name, job/quest summary, heat summary and
  non-sensitive public standing;
- owner-only components: wallet/inventory details, pending interaction and private quest
  clues, using owner-only replication or server RPC responses;
- replicated actors/components: pawn movement, table occupancy, dealer seat, public cards,
  roulette wheel result and interaction availability;
- server-only: RNG seed/stream, validation state, ledger IDs, anti-cheat counters and
  backend credentials.

Never replicate a secret RNG seed or backend credential. A public casino result may be
replicated after the server commits it; the client may animate the presentation but cannot
re-roll or amend the result. Reconnect hydrates the player from the durable profile and
replays only idempotent pending commands; reward application must remain single-use by
request ID/ledger ID.

Failure behavior is explicit: a lost backend connection pauses economy-mutating commands,
keeps movement/presentation available where safe, and surfaces a recoverable session state.
The server must not invent an offline payout or silently discard a committed transaction.

## 4. Camera and input transition

Use an input-mode state machine shared by C++ and Blueprint presentation:

1. `Explore`: third-person follow camera, movement/look input, world interaction trace.
2. `ApproachTable`: server-confirmed proximity/seat reservation; blend to a table rig.
3. `TableView`: first-person or close table camera, UI focus, gameplay input routed to
   typed bet/action commands.
4. `ResultPresentation`: server result replicated; camera and UI animate without changing
   state.
5. `ExitTable`: release seat on server, blend back to the prior explore camera and restore
   input context.

The client may request a transition, but only the server can confirm seat ownership and
the active phase. Camera rigs, blend times, input mapping contexts and widget transitions
are Blueprint-configurable. The C++ state machine owns allowed transitions, cancellation,
timeouts and cleanup on disconnect. A rejected request returns the client to `Explore`
without changing wallet or table state.

## 5. Asset and content pipeline

- Store Unreal binary assets with Git LFS; keep source art (for example `.blend`) and
  import metadata versioned beside the generated asset where licensing permits.
- Use Blender for authored meshes/UVs and licensed Fab/Quixel assets under a checked-in
  attribution/license inventory. No unlicensed marketplace asset may enter a packaged
  build.
- Name assets by type and feature (`SM_`, `SK_`, `M_`, `MI_`, `ABP_`, `WBP_`, `DA_`, `DT_`)
  and keep one owner folder per feature. Redirectors are fixed before merge.
- Import and cook in a pinned Unreal Engine version. CI must run an asset validation pass
  for missing references, redirectors, Nanite/Lumen platform incompatibilities, and
  accidental editor-only dependencies.
- Prefer DataAssets/DataTables for balance and content values. A content revision/hash is
  included in session admission and test reports so server and client mismatches are
  diagnosable.
- Keep source textures/audio out of the runtime package when cooked derivatives suffice;
  document any generated files that must be reproducible by CI.

## 6. CI and build entry points

The CI implementation belongs to the QA/operations surface; these are the Unreal-facing
entry points it must call after Owner approval:

```text
Setup:      <UE_ROOT>/Engine/Build/BatchFiles/RunUAT.bat BuildGraph -Script=... -Target="Setup"
Editor:     RunUAT.bat BuildCookRun -project=CasinoWorld.uproject -build -stage -pak -target=CasinoWorldEditor
Server:     RunUAT.bat BuildCookRun -project=CasinoWorld.uproject -server -serverconfig=Development \
              -build -stage -pak -target=CasinoWorldServer
Client:     RunUAT.bat BuildCookRun -project=CasinoWorld.uproject -build -stage -pak -target=CasinoWorld
Automation: <EditorBinary> CasinoWorld.uproject -unattended -nop4 -NullRHI \
              -ExecCmds="Automation RunTests CasinoWorld; Quit" -TestExit="Automation Test Queue Empty"
```

The exact BuildGraph script path, UE version, platform matrix and artifact retention are
Owner/QA decisions and remain open below. CI should fail on compiler warnings treated as
errors for game modules, automation failures, asset validation errors, content revision
mismatch fixtures, and missing LFS objects. Publish no public build from this phase.

## 7. Multiplayer test plan

### Automated tests

- **Authority:** client attempts to set balance, payout, inventory, quest reward, heat or
  ownership directly; each request is rejected and no state changes.
- **Casino transaction:** valid bet and result produce one debit/result/ledger sequence;
  duplicate request IDs produce the original result without a second debit or reward.
- **Invalid interaction:** wrong distance, occupied seat, stale phase, insufficient funds,
  and mismatched content revision are rejected with stable error codes.
- **Reconnect:** disconnect during approach, active hand, result presentation and after
  commit; reconnect hydrates the same balance/table/quest state and does not duplicate a
  reward.
- **Replication:** public table state reaches all four clients; private wallet/quest data
  reaches only its owner; late join receives a coherent snapshot.
- **Camera/input:** each accepted/rejected transition returns to a valid state and clears
  input mappings on exit/disconnect.

### Local smoke scenario

Launch one `CasinoWorldServer` and four clients against a fixed test map/content revision.
Record the server log and client IDs, then execute: four joins; one job payout; one player
approaches and reserves the table; a valid bet; result presentation; a second player join;
disconnect/reconnect the bettor; duplicate the original request; and graceful server stop.
Observed evidence must show four concurrent sessions, one authoritative result, one ledger
entry, no duplicated reward, private-state isolation and a clean reconnect.

### Performance and fault checks

Capture server frame time, replication bandwidth and memory for a 10-minute four-client
run. Add artificial latency/loss profiles (100 ms RTT and 2% packet loss) and verify that
commands time out or retry idempotently without divergent balances. These are baseline
measurements for Phase 3, not a release performance sign-off.

## 8. Verification notes

- Documentation verification: all requested Unreal areas are covered in sections 1-7;
  no engine code or files outside `projects/unreal/documents/` were changed by this task.
- Runtime verification is pending because no `.uproject`, Unreal installation, build target
  or test harness exists in the repository yet.
- Before Phase 1 implementation, QA must turn the command placeholders into executable
  scripts and record counts plus observed behavior in the child ticket.

## 9. Open Owner decisions

1. Approve or revise the proposed UE5/C++/Blueprint/EOS/PostgreSQL stack in Decision 0001.
2. Select the pinned Unreal Engine version and first CI platform (Windows, Linux, or both).
3. Confirm whether EOS is used for MVP identity/session discovery or a local LAN/session
   adapter is acceptable for offline and CI tests.
4. Approve the persistence outage behavior (pause economy commands as specified, or require
   a stricter whole-session pause).
5. Approve the camera default for table play (first-person, close third-person, or a
   per-table authored choice) and the maximum table occupancy for the MVP.
6. Approve the asset licensing inventory process and Git LFS storage/retention budget.
7. Approve the four-client smoke matrix, latency/loss profile and baseline thresholds before
   Phase 3 closes.
