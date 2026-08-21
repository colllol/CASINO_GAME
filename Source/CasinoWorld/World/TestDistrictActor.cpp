#include "TestDistrictActor.h"
#include "CasinoTableInteraction.h"
#include "Jobs/JobMarkerActor.h"
#include "Components/StaticMeshComponent.h"
#include "UObject/ConstructorHelpers.h"

ATestDistrictActor::ATestDistrictActor()
{
    PrimaryActorTick.bCanEverTick = false;
    SceneRoot = CreateDefaultSubobject<USceneComponent>(TEXT("SceneRoot"));
    RootComponent = SceneRoot;

    Floor = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Floor"));
    Floor->SetupAttachment(SceneRoot);
    Floor->SetRelativeScale3D(FVector(20.f, 20.f, 0.1f));
    static ConstructorHelpers::FObjectFinder<UStaticMesh> Cube(TEXT("/Engine/BasicShapes/Cube.Cube"));
    if (Cube.Succeeded())
    {
        Floor->SetStaticMesh(Cube.Object);
    }
}

void ATestDistrictActor::BeginPlay()
{
    Super::BeginPlay();
    if (!HasAuthority())
    {
        return;
    }

    GetWorld()->SpawnActor<AJobMarkerActor>(AJobMarkerActor::StaticClass(), FVector(450.f, 250.f, 100.f), FRotator::ZeroRotator);
    GetWorld()->SpawnActor<ACasinoTableInteraction>(ACasinoTableInteraction::StaticClass(), FVector(450.f, 0.f, 70.f), FRotator::ZeroRotator);
}
