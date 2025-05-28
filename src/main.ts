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
    console.log("QuickHub: プラグイン読み込み開始");

    /* 1) 設定ロード（ファイルが無ければ既定値で初期化） */
    this.settings = Object.assign(
      {},                                   // 新規オブジェクト
      DEFAULT_SETTINGS,                     // 既定値
      await this.loadData(),                // 保存済み
    );
    console.log("QuickHub: 設定読み込み完了", this.settings);

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
    if (this.settings.autoSync) {
      console.log("QuickHub: 自動同期が有効 - タイマー開始");
      this.startTimer();
    } else {
      console.log("QuickHub: 自動同期が無効");
    }

    new Notice("QuickHub Capture 読み込み完了");
    console.log("QuickHub: プラグイン読み込み完了");
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
    console.log("QuickHub: 同期開始");
    const { token, repo, inboxDir, saveFolder } = this.settings;

    /* チェック */
    if (!token || !repo) {
      new Notice("QuickHub: PAT と Repo を設定してください");
      console.log("QuickHub: 設定が不完全 - token:", !!token, "repo:", !!repo);
      return;
    }

    console.log("QuickHub: 設定確認完了 - repo:", repo, "inboxDir:", inboxDir, "saveFolder:", saveFolder);

    /* GitHub クライアント */
    const gh = new GitHubClient({ token, repo, inboxDir });

    try {
      /* 1) ファイル一覧取得 */
      console.log("QuickHub: ファイル一覧取得中...");
      const files = await gh.listInbox();
      console.log("QuickHub: 取得したファイル数:", files.length, "ファイル:", files.map(f => f.name));

      if (files.length === 0) {
        new Notice("QuickHub: 新規ファイルなし");
        return;
      }

      /* 2) 1 件ずつ取り込み */
      for (const f of files) {
        console.log("QuickHub: ファイル処理開始:", f.name);
        const body = await gh.fetchFile(f);
        console.log("QuickHub: ファイル内容取得完了:", f.name, "サイズ:", body.length);

        // 元のファイル名を使用（iOS側のタイムスタンプを保持）
        const name = this.normalizeFileName(f.name);
        const path = normalizePath(`${saveFolder}/${name}`);
        console.log("QuickHub: 元のファイル名:", f.name, "→ 正規化後:", name);
        console.log("QuickHub: 保存先パス:", path);

        /* Vault に保存（無ければ作成） */
        await this.app.vault.adapter.write(path, body);
        console.log("QuickHub: Vault保存完了:", name);

        /* 3) GitHub 側を削除 */
        console.log("QuickHub: GitHub削除開始:", f.name);
        try {
          await gh.deleteFile(f, `QuickHub: imported ${name}`);
          console.log("QuickHub: GitHub削除完了:", f.name);
        } catch (error) {
          console.warn("QuickHub: GitHub削除エラー (ファイル取り込みは完了):", f.name, error);
          // 削除に失敗してもファイル取り込み自体は成功なので処理を継続
        }
      }

      new Notice(`QuickHub: ${files.length} 件取り込み完了`);
      console.log("QuickHub: 同期完了");
    } catch (err) {
      console.error("QuickHub: 同期エラー:", err);
      new Notice("QuickHub: 同期失敗 (詳細はコンソール)");
    }
  }

  /* ------------------------- タイムスタンプ生成 -------------------------- */
  // 注：現在は元のファイル名を使用するため、この関数は使用していません
  // private timestamp(): string {
  //   const d = new Date();
  //   const pad = (n: number) => n.toString().padStart(2, "0");
  //   return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  // }

  /* --------------------------- タイマー制御 ----------------------------- */
  private startTimer() {
    const ms = this.settings.interval * 60_000;
    console.log("QuickHub: 自動同期タイマー開始 - 間隔:", this.settings.interval, "分 (", ms, "ms)");
    this.timer = window.setInterval(() => {
      console.log("QuickHub: 自動同期タイマー実行");
      this.syncNow();
    }, ms);
  }
  private clearTimer() {
    if (this.timer !== null) {
      console.log("QuickHub: 自動同期タイマー停止");
      window.clearInterval(this.timer);
    }
    this.timer = null;
  }

  /* ------------------------- ファイル名正規化 -------------------------- */
  private normalizeFileName(fileName: string): string {
    console.log("QuickHub: ファイル名正規化開始:", fileName);

    // .md拡張子を確認・除去
    let nameWithoutExt = fileName.replace(/\.md$/, '');
    let hasExtension = fileName.endsWith('.md');

    // 様々なパターンを統一形式 YYYY-MM-DD-HHMMSS に変換

    // パターン1: 2025-05-24-19-15-21 → 2025-05-24-191521
    const hyphenatedPattern1 = /^(\d{4}-\d{2}-\d{2})-(\d{2})-(\d{2})-(\d{2})$/;
    let match = nameWithoutExt.match(hyphenatedPattern1);
    if (match) {
      const [, datePart, hour, minute, second] = match;
      const normalizedName = `${datePart}-${hour}${minute}${second}${hasExtension ? '.md' : ''}`;
      console.log("QuickHub: ファイル名正規化(パターン1):", fileName, "→", normalizedName);
      return normalizedName;
    }

    // パターン2: 2025_05_24_19_15_21 → 2025-05-24-191521
    const underscorePattern = /^(\d{4})_(\d{2})_(\d{2})_(\d{2})_(\d{2})_(\d{2})$/;
    match = nameWithoutExt.match(underscorePattern);
    if (match) {
      const [, year, month, day, hour, minute, second] = match;
      const normalizedName = `${year}-${month}-${day}-${hour}${minute}${second}${hasExtension ? '.md' : ''}`;
      console.log("QuickHub: ファイル名正規化(パターン2):", fileName, "→", normalizedName);
      return normalizedName;
    }

    // パターン3: 20250524191521 → 2025-05-24-191521
    const compactPattern = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/;
    match = nameWithoutExt.match(compactPattern);
    if (match) {
      const [, year, month, day, hour, minute, second] = match;
      const normalizedName = `${year}-${month}-${day}-${hour}${minute}${second}${hasExtension ? '.md' : ''}`;
      console.log("QuickHub: ファイル名正規化(パターン3):", fileName, "→", normalizedName);
      return normalizedName;
    }

    // パターン4: memo_2025-05-24_19-15-21 → 2025-05-24-191521
    const prefixPattern = /^.*?(\d{4}[_-]\d{2}[_-]\d{2})[_-](\d{2})[_-](\d{2})[_-](\d{2}).*$/;
    match = nameWithoutExt.match(prefixPattern);
    if (match) {
      const [, datePart, hour, minute, second] = match;
      const normalizedDatePart = datePart.replace(/_/g, '-');
      const normalizedName = `${normalizedDatePart}-${hour}${minute}${second}${hasExtension ? '.md' : ''}`;
      console.log("QuickHub: ファイル名正規化(パターン4):", fileName, "→", normalizedName);
      return normalizedName;
    }

    // パターン5: 既に正しい形式 2025-05-24-191521
    const correctPattern = /^(\d{4}-\d{2}-\d{2}-\d{6})$/;
    match = nameWithoutExt.match(correctPattern);
    if (match) {
      console.log("QuickHub: ファイル名正規化不要(正しい形式):", fileName);
      return fileName;
    }

    // 上記に該当しない場合、日時を含んでいればできるだけ抽出
    const flexiblePattern = /(\d{4})[^\d]*(\d{2})[^\d]*(\d{2})[^\d]*(\d{2})[^\d]*(\d{2})[^\d]*(\d{2})/;
    match = nameWithoutExt.match(flexiblePattern);
    if (match) {
      const [, year, month, day, hour, minute, second] = match;
      const normalizedName = `${year}-${month}-${day}-${hour}${minute}${second}${hasExtension ? '.md' : ''}`;
      console.log("QuickHub: ファイル名正規化(フレキシブル):", fileName, "→", normalizedName);
      return normalizedName;
    }

    // どのパターンにも該当しない場合は、現在時刻で補完
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const fallbackName = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${hasExtension ? '.md' : ''}`;
    console.log("QuickHub: ファイル名正規化(フォールバック):", fileName, "→", fallbackName);
    return fallbackName;
  }
}
