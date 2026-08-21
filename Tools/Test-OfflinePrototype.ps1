[CmdletBinding()]
param()

$root = Split-Path -Parent $PSScriptRoot
$project = Join-Path $root "CasinoWorld.uproject"
$descriptor = Get-Content -LiteralPath $project -Raw | ConvertFrom-Json
if ($descriptor.Modules.Name -notcontains "CasinoWorld") { throw "CasinoWorld module missing" }

$requiredTargets = @("CasinoWorld.Target.cs", "CasinoWorldEditor.Target.cs", "CasinoWorldServer.Target.cs")
foreach ($target in $requiredTargets) {
    if (-not (Test-Path -LiteralPath (Join-Path $root "Source\$target"))) { throw "Target missing: $target" }
}

$ids = Get-Content -LiteralPath (Join-Path $root "Source\CasinoWorld\Core\CasinoGameIds.h") -Raw
foreach ($id in @("SLOTS", "ROULETTE", "BLACKJACK", "JACKPOT_MACHINE")) {
    if ($ids -notmatch "\b$id\b") { throw "Casino game ID missing: $id" }
}
if ($ids.IndexOf('#include "CoreMinimal.h"') -lt 0 -or
    $ids.IndexOf('#include "CoreMinimal.h"') -gt $ids.IndexOf('#include "CasinoGameIds.generated.h"')) {
    throw "CasinoGameIds.h must include CoreMinimal.h before its generated header"
}

$gameConfig = Get-Content -LiteralPath (Join-Path $root "Config\DefaultGame.ini") -Raw
if (($gameConfig | Select-String "MaxPlayers=10" -AllMatches).Matches.Count -lt 2) {
    throw "MaxPlayers=10 must be set for GameMode and GameSession"
}

$source = Get-ChildItem -LiteralPath (Join-Path $root "Source") -Recurse -File |
    Get-Content -Raw | Out-String
foreach ($seam in @("IOfflinePersistenceAdapter", "IEOSAdapter", "ATestDistrictActor", "AJobMarkerActor", "ACasinoTableInteraction")) {
    if ($source -notmatch "\b$seam\b") { throw "Prototype seam missing: $seam" }
}

$character = Get-Content -LiteralPath (Join-Path $root "Source\CasinoWorld\Characters\CasinoWorldCharacter.cpp") -Raw
$table = Get-Content -LiteralPath (Join-Path $root "Source\CasinoWorld\World\CasinoTableInteraction.cpp") -Raw
$cameraAssertions = @(
    @{ Text = $table; Pattern = 'CreateDefaultSubobject<UCameraComponent>\(TEXT\("TableCamera"\)\)'; Name = "table camera component" },
    @{ Text = $table; Pattern = 'SetRelativeLocation\('; Name = "close-table camera framing" },
    @{ Text = $character; Pattern = 'SetViewTargetWithBlend\(Table,'; Name = "table camera blend" },
    @{ Text = $character; Pattern = 'SetViewTargetWithBlend\(this,'; Name = "explore camera blend" },
    @{ Text = $character; Pattern = 'ActiveTable->ReleaseSeat\(this\)'; Name = "seat release request" },
    @{ Text = $table; Pattern = 'bOccupied = false'; Name = "seat availability reset" },
    @{ Text = $character; Pattern = 'CameraMode = EPrototypeCameraMode::Explore'; Name = "valid Explore state" }
)
foreach ($assertion in $cameraAssertions) {
    if ($assertion.Text -notmatch $assertion.Pattern) { throw "Camera/release seam missing: $($assertion.Name)" }
}

Write-Output "Offline prototype static smoke passed: module=1 targets=3 ids=4 maxPlayers=10 seams=5 cameraRelease=7"
