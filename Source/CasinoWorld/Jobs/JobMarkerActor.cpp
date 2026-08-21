#include "JobMarkerActor.h"
#include "Components/StaticMeshComponent.h"
#include "UObject/ConstructorHelpers.h"

AJobMarkerActor::AJobMarkerActor()
{
    PrimaryActorTick.bCanEverTick = false;
    MarkerMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("MarkerMesh"));
    RootComponent = MarkerMesh;
    MarkerMesh->SetRelativeScale3D(FVector(0.5f));
    static ConstructorHelpers::FObjectFinder<UStaticMesh> Sphere(TEXT("/Engine/BasicShapes/Sphere.Sphere"));
    if (Sphere.Succeeded())
    {
        MarkerMesh->SetStaticMesh(Sphere.Object);
    }
}
