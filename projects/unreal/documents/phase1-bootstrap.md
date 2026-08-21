# Phase 1 Unreal Bootstrap

## Boundary

`CasinoWorld.uproject` targets UE 5.4 on Win64 and compiles one `CasinoWorld` module
for the generated client, `CasinoWorldEditor`, and `CasinoWorldServer` targets. The
prototype allows up to 10 players in configuration, while gameplay authority remains
server-side for future multiplayer work.

## Prototype seams

- C++ owns movement, interaction acceptance, camera mode state, and typed game IDs.
- Blueprint/data assets are expected to own actor composition, table camera rigs, prompts,
  and presentation once an editor is available.
- `IOfflinePersistenceAdapter` and `IEOSAdapter` define local persistence and EOS seams;
  the local implementation writes opaque profiles under `Saved/Profiles`, while no
  backend, EOS SDK, economy settlement, or network service is included.
- `ACasinoWorldCharacter` provides third-person movement and blends to a close-table
  `UCameraComponent` owned by `ACasinoTableInteraction`. Exiting blends back to the pawn,
  releases the occupied seat, restores walking, and returns to `Explore`.
- `AJobMarkerActor` and `ACasinoTableInteraction` are the single job/table test actors.
  `ATestDistrictActor` constructs the offline district from Engine basic shapes, so no
  binary `.umap` is required for bootstrap.

## Verification

`Tools/Build-OfflinePrototype.ps1` builds Editor, Server, or Client through Unreal's
`Build.bat`; `Tools/Run-OfflineSmoke.ps1` builds the Editor target and starts the test
district headlessly. On the bootstrap host, Unreal executables were not discoverable and
no `UNREAL_ROOT` was set, so an Unreal build/smoke run is blocked. Static checks validate
JSON, target names, required IDs, max-player settings, and prototype seams until a UE5
installation is provisioned.
