[CmdletBinding()]
param(
    [string]$UnrealRoot = $env:UNREAL_ROOT
)

if ([string]::IsNullOrWhiteSpace($UnrealRoot)) {
    throw "UNREAL_ROOT must point to an Unreal Engine 5 installation."
}

$project = Join-Path $PSScriptRoot "..\CasinoWorld.uproject"
$editor = Join-Path $UnrealRoot "Engine\Binaries\Win64\UnrealEditor-Cmd.exe"
if (-not (Test-Path -LiteralPath $editor)) { throw "UnrealEditor-Cmd.exe not found: $editor" }

& (Join-Path $PSScriptRoot "Build-OfflinePrototype.ps1") -UnrealRoot $UnrealRoot -Target Editor
& $editor $project /Engine/Maps/Entry -game -NullRHI -Unattended -NoSplash -NoSound '-ExecCmds=quit'
if ($LASTEXITCODE -ne 0) { throw "Offline smoke failed with exit code $LASTEXITCODE" }
Write-Output "Offline smoke passed: Editor target built and Entry map started with CasinoWorldGameMode."
