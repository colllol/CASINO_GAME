#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "CasinoWorldCharacter.generated.h"

class ACasinoTableInteraction;

UENUM(BlueprintType)
enum class EPrototypeCameraMode : uint8
{
    Explore,
    TableView
};

UCLASS()
class CASINOWORLD_API ACasinoWorldCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    ACasinoWorldCharacter();

    virtual void SetupPlayerInputComponent(UInputComponent* PlayerInputComponent) override;
    virtual void EndPlay(const EEndPlayReason::Type EndPlayReason) override;

    UFUNCTION(BlueprintCallable, Category = "Prototype|Camera")
    bool EnterTableView(class ACasinoTableInteraction* Table);

    UFUNCTION(BlueprintCallable, Category = "Prototype|Camera")
    void ExitTableView();

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Prototype|Camera")
    EPrototypeCameraMode CameraMode = EPrototypeCameraMode::Explore;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Prototype|Camera")
    TObjectPtr<class USpringArmComponent> CameraBoom;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Prototype|Camera")
    TObjectPtr<class UCameraComponent> FollowCamera;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Prototype|Camera")
    float TableCameraBlendSeconds = 0.75f;

protected:
    void MoveForward(float Value);
    void MoveRight(float Value);
    void Interact();

private:
    UPROPERTY(Transient)
    TObjectPtr<ACasinoTableInteraction> ActiveTable;
};
