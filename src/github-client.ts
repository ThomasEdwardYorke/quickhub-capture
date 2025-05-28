import { requestUrl } from "obsidian";

export interface ClientOpt {
  token: string;
  repo: string;      // "user/repo"
  inboxDir: string;  // "quick-inbox"
}

export interface RemoteFile {
  name: string;
  path: string;
  sha: string;
  download_url: string;
}

/** GitHub Contents API を叩くラッパクラス */
export class GitHubClient {
  private readonly base = "https://api.github.com";
  constructor(private opt: ClientOpt) {}

  private headers() {
    return {
      Authorization: `Bearer ${this.opt.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json",
    };
  }

  async listInbox(): Promise<RemoteFile[]> {
    const url = `${this.base}/repos/${this.opt.repo}/contents/${this.opt.inboxDir}`;
    const res = await requestUrl({ url, headers: this.headers() });
    if (res.status === 404) return [];

    // .gitkeepファイルをフィルタリング
    const files = res.json as RemoteFile[];
    return files.filter((f) => !f.name.startsWith(".gitkeep"));
  }

  async fetchFile(file: RemoteFile): Promise<string> {
    const res = await requestUrl({ url: file.download_url });
    return res.text;
  }

  async deleteFile(file: RemoteFile, message = "QuickHub imported"): Promise<void> {
    const url = `${this.base}/repos/${this.opt.repo}/contents/${file.path}`;
    try {
      await requestUrl({
        url,
        method: "DELETE",
        headers: this.headers(),
        body: JSON.stringify({ message, sha: file.sha }),
      });
    } catch (error: any) {
      // 404エラーの場合は既にファイルが削除されているので成功とみなす
      if (error.status === 404) {
        console.log(`QuickHub: ファイルは既に削除済み: ${file.name}`);
        return;
      }
      // その他のエラーは再スロー
      throw error;
    }
  }
}
