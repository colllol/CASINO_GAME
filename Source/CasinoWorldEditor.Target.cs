using UnrealBuildTool;

public class CasinoWorldEditorTarget : TargetRules
{
    public CasinoWorldEditorTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Editor;
        DefaultBuildSettings = BuildSettingsVersion.V5;
        IncludeOrderVersion = EngineIncludeOrderVersion.Unreal5_4;
        ExtraModuleNames.Add("CasinoWorld");
    }
}
