#include "CasinoWorldGameMode.h"
#include "Characters/CasinoWorldCharacter.h"
#include "Engine/World.h"
#include "GameFramework/PlayerStart.h"
#include "World/TestDistrictActor.h"

ACasinoWorldGameMode::ACasinoWorldGameMode()
{
    DefaultPawnClass = ACasinoWorldCharacter::StaticClass();
    MaxPlayers = 10;
}

void ACasinoWorldGameMode::InitGame(const FString& MapName, const FString& Options, FString& ErrorMessage)
{
    Super::InitGame(MapName, Options, ErrorMessage);
    GetWorld()->SpawnActor<APlayerStart>(APlayerStart::StaticClass(), FVector(0.f, 0.f, 120.f), FRotator::ZeroRotator);
}

void ACasinoWorldGameMode::BeginPlay()
{
    Super::BeginPlay();
    if (HasAuthority())
    {
        GetWorld()->SpawnActor<ATestDistrictActor>(ATestDistrictActor::StaticClass(), FVector::ZeroVector, FRotator::ZeroRotator);
    }
}
