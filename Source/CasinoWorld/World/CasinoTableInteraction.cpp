#include "CasinoTableInteraction.h"
#include "Camera/CameraComponent.h"
#include "Components/StaticMeshComponent.h"
#include "UObject/ConstructorHelpers.h"

ACasinoTableInteraction::ACasinoTableInteraction()
{
    PrimaryActorTick.bCanEverTick = false;
    SetReplicates(true);
    TableMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("TableMesh"));
    RootComponent = TableMesh;
    TableMesh->SetRelativeScale3D(FVector(1.5f, 1.f, 0.7f));
    static ConstructorHelpers::FObjectFinder<UStaticMesh> Cube(TEXT("/Engine/BasicShapes/Cube.Cube"));
    if (Cube.Succeeded())
    {
        TableMesh->SetStaticMesh(Cube.Object);
    }

    TableCamera = CreateDefaultSubobject<UCameraComponent>(TEXT("TableCamera"));
    TableCamera->SetupAttachment(TableMesh);
    TableCamera->SetRelativeLocation(FVector(-180.f, 0.f, 130.f));
    TableCamera->SetRelativeRotation(FRotator(-18.f, 0.f, 0.f));
    TableCamera->SetFieldOfView(70.f);
}

bool ACasinoTableInteraction::RequestInteract(AActor* RequestingPlayer)
{
    if (HasAuthority() && IsValid(RequestingPlayer) && !bOccupied)
    {
        OccupyingPlayer = RequestingPlayer;
        bOccupied = true;
        return true;
    }
    return false;
}

bool ACasinoTableInteraction::ReleaseSeat(AActor* RequestingPlayer)
{
    if (HasAuthority() && IsValid(RequestingPlayer) && OccupyingPlayer == RequestingPlayer)
    {
        OccupyingPlayer = nullptr;
        bOccupied = false;
        return true;
    }
    return false;
}
