#pragma once

#include "CoreMinimal.h"
#include "CasinoGameIds.generated.h"

UENUM(BlueprintType)
enum class ECasinoGameId : uint8
{
    SLOTS,
    ROULETTE,
    BLACKJACK,
    JACKPOT_MACHINE
};
