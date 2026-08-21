#pragma once

#include "Modules/ModuleManager.h"

class FCasinoWorldModule final : public FDefaultGameModuleImpl
{
public:
    virtual void StartupModule() override;
    virtual void ShutdownModule() override;
};
