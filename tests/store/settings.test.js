import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "../../src/store/settings.js";

describe("useSettingsStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.setState({
      includeMermaid: true,
      includeAscii: false,
      hasSeenWelcome: false,
      specPanelCollapsed: false,
      tweaks: { theme: "warm-dark", accent: "#2680eb", density: "comfortable", showGrid: true },
      apiKey: "",
      githubPat: "",
      loaded: false,
    });
  });

  it("loads defaults on first run", async () => {
    await useSettingsStore.getState().load();
    const s = useSettingsStore.getState();
    expect(s.loaded).toBe(true);
    expect(s.includeMermaid).toBe(true);
    expect(s.tweaks.theme).toBe("warm-dark");
    expect(s.apiKey).toBe("");
  });

  it("update() persists patched values", async () => {
    await useSettingsStore.getState().load();
    await useSettingsStore.getState().update({ includeMermaid: false, includeAscii: true });
    const s = useSettingsStore.getState();
    expect(s.includeMermaid).toBe(false);
    expect(s.includeAscii).toBe(true);
  });

  it("setGithubPat() stores and clears", async () => {
    await useSettingsStore.getState().setGithubPat("ghp_test_token");
    expect(useSettingsStore.getState().githubPat).toBe("ghp_test_token");
    await useSettingsStore.getState().setGithubPat("");
    expect(useSettingsStore.getState().githubPat).toBe("");
  });

  it("setTweak() merges tweaks and persists", async () => {
    await useSettingsStore.getState().load();
    await useSettingsStore.getState().setTweak("accent", "#ff0000");
    expect(useSettingsStore.getState().tweaks.accent).toBe("#ff0000");
    // Existing tweaks preserved
    expect(useSettingsStore.getState().tweaks.theme).toBe("warm-dark");
  });

  it("setTweak() accepts an edits object", async () => {
    await useSettingsStore.getState().load();
    await useSettingsStore.getState().setTweak({ accent: "#00ff00", showGrid: false });
    expect(useSettingsStore.getState().tweaks.accent).toBe("#00ff00");
    expect(useSettingsStore.getState().tweaks.showGrid).toBe(false);
  });

  it("setApiKey() stores and clears", async () => {
    await useSettingsStore.getState().setApiKey("sk-ant-test-key");
    expect(useSettingsStore.getState().apiKey).toBe("sk-ant-test-key");
    await useSettingsStore.getState().setApiKey("");
    expect(useSettingsStore.getState().apiKey).toBe("");
  });
});
