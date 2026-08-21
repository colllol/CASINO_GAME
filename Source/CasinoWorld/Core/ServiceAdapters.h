#pragma once

#include "CoreMinimal.h"

// Offline-first seams. Implementations must be supplied by a later backend/EOS phase.
class CASINOWORLD_API IOfflinePersistenceAdapter
{
public:
    virtual ~IOfflinePersistenceAdapter() = default;
    virtual bool LoadProfile(const FString& PlayerId, TArray<uint8>& OutData) = 0;
    virtual bool SaveProfile(const FString& PlayerId, const TArray<uint8>& Data) = 0;
};

class CASINOWORLD_API IEOSAdapter
{
public:
    virtual ~IEOSAdapter() = default;
    virtual bool IsAvailable() const = 0;
    virtual bool CreateOrJoinSession(int32 MaxPlayers) = 0;
};

class CASINOWORLD_API FLocalPersistenceAdapter final : public IOfflinePersistenceAdapter
{
public:
    virtual bool LoadProfile(const FString& PlayerId, TArray<uint8>& OutData) override;
    virtual bool SaveProfile(const FString& PlayerId, const TArray<uint8>& Data) override;

};
