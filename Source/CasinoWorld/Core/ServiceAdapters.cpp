#include "ServiceAdapters.h"
#include "HAL/FileManager.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"

namespace
{
FString GetProfilePath(const FString& PlayerId)
{
    return FPaths::Combine(FPaths::ProjectSavedDir(), TEXT("Profiles"), FPaths::MakeValidFileName(PlayerId) + TEXT(".sav"));
}
}

bool FLocalPersistenceAdapter::LoadProfile(const FString& PlayerId, TArray<uint8>& OutData)
{
    if (PlayerId.IsEmpty())
    {
        OutData.Reset();
        return false;
    }
    return FFileHelper::LoadFileToArray(OutData, *GetProfilePath(PlayerId));
}

bool FLocalPersistenceAdapter::SaveProfile(const FString& PlayerId, const TArray<uint8>& Data)
{
    if (PlayerId.IsEmpty())
    {
        return false;
    }
    const FString ProfilePath = GetProfilePath(PlayerId);
    IFileManager::Get().MakeDirectory(*FPaths::GetPath(ProfilePath), true);
    return FFileHelper::SaveArrayToFile(Data, *ProfilePath);
}
