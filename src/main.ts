/* -------------------------------------------------------------------------
 * main.ts – QuickHub Capture プラグイン本体
 * -------------------------------------------------------------------------
 *  ▸ GitHub の quick-inbox からメモを取得 → Vault に保存 → GitHub 側を削除
 *  ▸ 自動同期タイマー・リボンアイコン・コマンド登録
 *  ▸ 設定 UI は QCSettingTab（settings.ts）に委譲
 * -----------------------------------------------------------------------*/

import { Plugin, Notice, normalizePath } from "obsidian";
import { GitHubClient } from "./github-client";
import { QCSettings, DEFAULT_SETTINGS, QCSettingTab } from "./settings";

/* =========================== Plugin クラス本体 =========================== */
export default class QuickHubCapture extends Plugin {
  public settings!: QCSettings;           // 設定オブジェクト
  private timer: number | null = null;    // 自動同期タイマー id

  /* --------------------------- プラグイン読み込み --------------------------- */
  async onload() {
    /* 1) 設定ロード（ファイルが無ければ既定値で初期化） */
    this.settings = Object.assign(
      {},                                   // 新規オブジェクト
      DEFAULT_SETTINGS,                     // 既定値
      await this.loadData(),                // 保存済み
    );

    /* 2) 設定タブを追加（this を直接渡す） */
    this.addSettingTab(new QCSettingTab(this.app, this));

    /* 3) コマンド登録（⌘P → quickhub-sync） */
    this.addCommand({
      id:   "quickhub-sync",
      name: "QuickHub: 手動同期",
      callback: () => this.syncNow(),
    });

    /* 4) リボンアイコン */
    this.addRibbonIcon("cloud-download", "QuickHub Sync", () => this.syncNow());

    /* 5) 自動同期タイマー */
    if (this.settings.autoSync) this.startTimer();

    new Notice("QuickHub Capture 読み込み完了");
  }

  /* ---------------------------- アンロード処理 ----------------------------- */
  onunload() {
    this.clearTimer();
  }

  /* -------------------------- 設定の保存ラッパ ---------------------------- */
  /** QCSettingTab から呼ばれる */
  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    /* タイマー設定が変わった場合に反映させる */
    this.clearTimer();
    if (this.settings.autoSync) this.startTimer();
  }

  /* =========================== 同期メイン処理 ============================ */
  private async syncNow(): Promise<void> {
    const { token, repo, inboxDir, saveFolder } = this.settings;

    /* チェック */
    if (!token || !repo) {
      new Notice("QuickHub: PAT と Repo を設定してください");
      return;
    }

    /* GitHub クライアント */
    const gh = new GitHubClient({ token, repo, inboxDir });

    try {
      /* 1) ファイル一覧取得 */
      const files = await gh.listInbox();
      if (files.length === 0) {
        new Notice("QuickHub: 新規ファイルなし");
        return;
      }

      /* 2) 1 件ずつ取り込み */
      for (const f of files) {
        const body = await gh.fetchFile(f);
        const name = `${this.timestamp()}.md`;
        const path = normalizePath(`${saveFolder}/${name}`);

        /* Vault に保存（無ければ作成） */
        await this.app.vault.adapter.write(path, body);

        /* 3) GitHub 側を削除 */
        await gh.deleteFile(f, `QuickHub: imported ${name}`);
      }

      new Notice(`QuickHub: ${files.length} 件取り込み完了`);
    } catch (err) {
      console.error(err);
      new Notice("QuickHub: 同期失敗 (詳細はコンソール)");
    }
  }

  /* ------------------------- タイムスタンプ生成 -------------------------- */
  private timestamp(): string {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(
      d.getHours(),
    )}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }

  /* --------------------------- タイマー制御 ----------------------------- */
  private startTimer() {
    const ms = this.settings.interval * 60_000;
    this.timer = window.setInterval(() => this.syncNow(), ms);
  }
  private clearTimer() {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
  }
}
