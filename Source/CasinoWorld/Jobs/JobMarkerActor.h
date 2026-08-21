#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "JobMarkerActor.generated.h"

UCLASS()
class CASINOWORLD_API AJobMarkerActor : public AActor
{
    GENERATED_BODY()

public:
    AJobMarkerActor();

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Job")
    FName JobId = TEXT("JOB_TEST_DELIVERY");

private:
    UPROPERTY(VisibleAnywhere, Category = "Prototype")
    TObjectPtr<class UStaticMeshComponent> MarkerMesh;
};
