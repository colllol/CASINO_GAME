[CmdletBinding()]
param(
    [string]$UnrealRoot = $env:UNREAL_ROOT,
    [ValidateSet("Editor", "Server", "Client")]
    [string]$Target = "Editor",
    [ValidateSet("Development", "Shipping")]
    [string]$Configuration = "Development"
)

$project = Join-Path $PSScriptRoot "..\CasinoWorld.uproject"
if (-not (Test-Path -LiteralPath $project)) { throw "Missing project: $project" }
if ([string]::IsNullOrWhiteSpace($UnrealRoot)) {
    throw "UNREAL_ROOT must point to an Unreal Engine 5 installation."
}

$build = Join-Path $UnrealRoot "Engine\Build\BatchFiles\Build.bat"
if (-not (Test-Path -LiteralPath $build)) { throw "Build.bat not found: $build" }

$buildTarget = switch ($Target) {
    "Editor" { "CasinoWorldEditor" }
    "Server" { "CasinoWorldServer" }
    default { "CasinoWorld" }
}

& $build $buildTarget Win64 $Configuration "-Project=$project" -WaitMutex -FromMsBuild
if ($LASTEXITCODE -ne 0) { throw "Unreal build failed with exit code $LASTEXITCODE" }
