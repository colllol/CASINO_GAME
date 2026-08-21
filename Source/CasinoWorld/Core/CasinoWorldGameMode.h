#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "CasinoWorldGameMode.generated.h"

UCLASS()
class CASINOWORLD_API ACasinoWorldGameMode : public AGameModeBase
{
    GENERATED_BODY()

public:
    ACasinoWorldGameMode();
    virtual void InitGame(const FString& MapName, const FString& Options, FString& ErrorMessage) override;
    virtual void BeginPlay() override;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Session")
    int32 MaxPlayers = 10;
};
