#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "TestDistrictActor.generated.h"

UCLASS()
class CASINOWORLD_API ATestDistrictActor : public AActor
{
    GENERATED_BODY()

public:
    ATestDistrictActor();
    virtual void BeginPlay() override;

private:
    UPROPERTY()
    TObjectPtr<class USceneComponent> SceneRoot;

    UPROPERTY()
    TObjectPtr<class UStaticMeshComponent> Floor;
};
