#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "Core/CasinoGameIds.h"
#include "CasinoTableInteraction.generated.h"

UCLASS()
class CASINOWORLD_API ACasinoTableInteraction : public AActor
{
    GENERATED_BODY()

public:
    ACasinoTableInteraction();

    UFUNCTION(BlueprintCallable, Category = "Prototype|Interaction")
    bool RequestInteract(AActor* RequestingPlayer);

    UFUNCTION(BlueprintCallable, Category = "Prototype|Interaction")
    bool ReleaseSeat(AActor* RequestingPlayer);

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Casino")
    ECasinoGameId GameId = ECasinoGameId::ROULETTE;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Casino")
    bool bOccupied = false;

private:
    UPROPERTY(VisibleAnywhere, Category = "Prototype")
    TObjectPtr<class UStaticMeshComponent> TableMesh;

    UPROPERTY(VisibleAnywhere, Category = "Prototype")
    TObjectPtr<class UCameraComponent> TableCamera;

    UPROPERTY(Transient)
    TObjectPtr<AActor> OccupyingPlayer;
};
