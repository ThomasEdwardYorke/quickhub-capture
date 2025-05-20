import { App, Plugin, PluginSettingTab, Setting } from "obsidian";

/* ----------------------------- 設定型 ----------------------------- */
export interface QCSettings {
  token: string;
  repo: string;
  inboxDir: string;
  saveFolder: string;
  autoSync: boolean;
  interval: number;        // 分
}

export const DEFAULT_SETTINGS: QCSettings = {
  token: "",
  repo: "",
  inboxDir: "quick-inbox",
  saveFolder: "Inbox",
  autoSync: false,
  interval: 10,
};

/* --------------------------- SettingTab --------------------------- */
type QCPlugin = Plugin & {
  settings: QCSettings;
  saveSettings: () => Promise<void>;
};

export class QCSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: QCPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "QuickHub Capture – 設定" });

    /* GitHub Token -------------------------------------------------- */
    new Setting(containerEl)
      .setName("GitHub Token")
      .setDesc("contents:write 権限のみ付与した PAT")
      .addText((t) =>
        t
          .setPlaceholder("ghp_xxx")
          .setValue(this.plugin.settings.token)
          .onChange(async (v) => {
            this.plugin.settings.token = v.trim();
            await this.plugin.saveSettings();
          }),
      );

    /* Repository ---------------------------------------------------- */
    new Setting(containerEl)
      .setName("リポジトリ (user/repo)")
      .addText((t) =>
        t
          .setPlaceholder("username/obsidian_notes")
          .setValue(this.plugin.settings.repo)
          .onChange(async (v) => {
            this.plugin.settings.repo = v.trim();
            await this.plugin.saveSettings();
          }),
      );

    /* Inbox dir ----------------------------------------------------- */
    new Setting(containerEl)
      .setName("Inbox ディレクトリ (GitHub 側)")
      .addText((t) =>
        t
          .setValue(this.plugin.settings.inboxDir)
          .onChange(async (v) => {
            this.plugin.settings.inboxDir = v || "quick-inbox";
            await this.plugin.saveSettings();
          }),
      );

    /* Save folder --------------------------------------------------- */
    new Setting(containerEl)
      .setName("Vault 保存先フォルダ")
      .addText((t) =>
        t
          .setValue(this.plugin.settings.saveFolder)
          .onChange(async (v) => {
            this.plugin.settings.saveFolder = v || "Inbox";
            await this.plugin.saveSettings();
          }),
      );

    /* Auto-sync ----------------------------------------------------- */
    new Setting(containerEl)
      .setName("自動同期を有効化")
      .addToggle((tog) =>
        tog
          .setValue(this.plugin.settings.autoSync)
          .onChange(async (v) => {
            this.plugin.settings.autoSync = v;
            await this.plugin.saveSettings();
          }),
      );

    /* Interval ------------------------------------------------------ */
    new Setting(containerEl)
      .setName("同期間隔 (分)")
      .addSlider((s) =>
        s
          .setLimits(1, 60, 1)
          .setDynamicTooltip()
          .setValue(this.plugin.settings.interval)
          .onChange(async (v) => {
            this.plugin.settings.interval = v;
            await this.plugin.saveSettings();
          }),
      );
  }
}
