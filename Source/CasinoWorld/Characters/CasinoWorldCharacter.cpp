#include "CasinoWorldCharacter.h"
#include "Camera/CameraComponent.h"
#include "Components/CapsuleComponent.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "GameFramework/PlayerController.h"
#include "GameFramework/SpringArmComponent.h"
#include "World/CasinoTableInteraction.h"

ACasinoWorldCharacter::ACasinoWorldCharacter()
{
    GetCapsuleComponent()->InitCapsuleSize(42.f, 96.f);
    bUseControllerRotationYaw = false;
    GetCharacterMovement()->bOrientRotationToMovement = true;

    CameraBoom = CreateDefaultSubobject<USpringArmComponent>(TEXT("CameraBoom"));
    CameraBoom->SetupAttachment(RootComponent);
    CameraBoom->TargetArmLength = 360.f;
    CameraBoom->bUsePawnControlRotation = true;

    FollowCamera = CreateDefaultSubobject<UCameraComponent>(TEXT("FollowCamera"));
    FollowCamera->SetupAttachment(CameraBoom, USpringArmComponent::SocketName);
    FollowCamera->bUsePawnControlRotation = false;
}

void ACasinoWorldCharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
    Super::SetupPlayerInputComponent(PlayerInputComponent);
    PlayerInputComponent->BindAxis("MoveForward", this, &ACasinoWorldCharacter::MoveForward);
    PlayerInputComponent->BindAxis("MoveRight", this, &ACasinoWorldCharacter::MoveRight);
    PlayerInputComponent->BindAxis("Turn", this, &APawn::AddControllerYawInput);
    PlayerInputComponent->BindAxis("LookUp", this, &APawn::AddControllerPitchInput);
    PlayerInputComponent->BindAction("Interact", IE_Pressed, this, &ACasinoWorldCharacter::Interact);
}

void ACasinoWorldCharacter::MoveForward(float Value)
{
    if (Controller && FMath::Abs(Value) > KINDA_SMALL_NUMBER)
    {
        AddMovementInput(GetActorForwardVector(), Value);
    }
}

void ACasinoWorldCharacter::MoveRight(float Value)
{
    if (Controller && FMath::Abs(Value) > KINDA_SMALL_NUMBER)
    {
        AddMovementInput(GetActorRightVector(), Value);
    }
}

bool ACasinoWorldCharacter::EnterTableView(ACasinoTableInteraction* Table)
{
    APlayerController* PlayerController = Cast<APlayerController>(GetController());
    if (!IsValid(Table) || !PlayerController)
    {
        return false;
    }

    ActiveTable = Table;
    CameraMode = EPrototypeCameraMode::TableView;
    GetCharacterMovement()->DisableMovement();
    PlayerController->SetViewTargetWithBlend(Table, TableCameraBlendSeconds, VTBlend_Cubic);
    return true;
}

void ACasinoWorldCharacter::ExitTableView()
{
    if (IsValid(ActiveTable))
    {
        ActiveTable->ReleaseSeat(this);
    }

    if (APlayerController* PlayerController = Cast<APlayerController>(GetController()))
    {
        PlayerController->SetViewTargetWithBlend(this, TableCameraBlendSeconds, VTBlend_Cubic);
    }

    ActiveTable = nullptr;
    CameraMode = EPrototypeCameraMode::Explore;
    GetCharacterMovement()->SetMovementMode(MOVE_Walking);
}

void ACasinoWorldCharacter::EndPlay(const EEndPlayReason::Type EndPlayReason)
{
    if (IsValid(ActiveTable))
    {
        ActiveTable->ReleaseSeat(this);
    }
    Super::EndPlay(EndPlayReason);
}

void ACasinoWorldCharacter::Interact()
{
    if (CameraMode == EPrototypeCameraMode::TableView)
    {
        ExitTableView();
        return;
    }

    FHitResult Hit;
    const FVector Start = FollowCamera->GetComponentLocation();
    const FVector End = Start + FollowCamera->GetForwardVector() * 350.f;
    FCollisionQueryParams Params(SCENE_QUERY_STAT(PrototypeInteract), false, this);
    if (GetWorld()->LineTraceSingleByChannel(Hit, Start, End, ECC_Visibility, Params))
    {
        if (ACasinoTableInteraction* Table = Cast<ACasinoTableInteraction>(Hit.GetActor()))
        {
            if (Table->RequestInteract(this) && !EnterTableView(Table))
            {
                Table->ReleaseSeat(this);
            }
        }
    }
}
