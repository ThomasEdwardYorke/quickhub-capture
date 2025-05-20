# QuickHub Capture 開発チェックリスト

本ファイルはプロジェクトの進捗を可視化するためのチェックリストです。
各タスクが完了したら `[ ]` を `[x]` に変更し、進捗を更新してください。

---

## 2. Lint & テストで "壊れにくい" コードに

### 目的
公開後に他人が読んだり PR をもらう際の差分を最小にし、回帰バグを早期発見する。

### タスク
- [x] `npm run lint` を実行して ESLint を全てパスする
- [x] `npm test` で Jest ユニットテストを実行し全テスト緑
- [ ] 赤が出た場合：メッセージどおりに `src/` を修正し再実行
- [ ] 緑になるまで次工程へ進まないことを確認

---

## 3. GitHub Actions をセットアップして CI を自動化

### 目的
手元 OK でもリモートで再現し「動くコミット」だけ `main` に残す。

### タスク
- [x] `.github/workflows/ci.yml` を作成（`npm ci → npm test → npm run build`）
- [x] `.github/workflows/release.yml` を作成（tag push → build → ZIP → GitHub Release）
- [ ] `git add . && git commit -m "ci: add workflows"`
- [ ] `git push origin main`
- [ ] GitHub `Actions` タブでワークフローが緑になることを確認

---

## 4. バージョンを上げてリリース ZIP を自動生成

### 目的
"ビルド済み ZIP" を毎回手作業で作らない＝ヒューマンエラー防止。

### タスク
- [ ] `npm version patch` を実行し `0.1.x` → `0.1.x+1` & git tag 作成
- [ ] `git push --follow-tags` で tag を GitHub に送信
- [ ] Release ワークフローが起動し `quickhub-capture.zip` が添付されることを確認

---

## 5. README を "ユーザー視点" で仕上げる

### 目的
README が分かりやすいほどストア審査が早く、Issue も減少。

### タスク
- [ ] 概要 (About) を 1–2 行で記述（例: "iOS のショートカットから GitHub 経由で Obsidian にメモ"）
- [ ] 機能 (Features) を列挙（クイックメモ取り込み、自動削除でリポジトリが散らからない など）
- [ ] インストール手順（ZIP を `.obsidian/plugins/` に展開）
- [ ] セットアップ手順（PAT 作成フロー、設定画面の各項目説明）
- [ ] iOS ショートカット導入手順（iCloud リンク & 30 秒 GIF）
- [ ] セキュリティに関する注意 (PAT scopes, gitignore など)
- [ ] "なぜ？" セクションを追加してメリットを明確化

---

## 6. コミュニティプラグイン PR を出す

### 目的
PR がマージされると Obsidian アプリの「コミュニティプラグイン検索」に表示され、ユーザーはワンクリックで導入可能。

### タスク
- [ ] `obsidianmd/obsidian-releases` を Fork → clone
- [ ] `community-plugins.json` の末尾に下記を追加
  ```json
  {
    "id": "quickhub-capture",
    "name": "QuickHub Capture",
    "author": "ThomasEdwardYorke",
    "description": "iOS/iPadOS のショートカットから GitHub 経由で Obsidian Vault にクイックメモを取り込む",
    "repo": "ThomasEdwardYorke/quickhub-capture"
  }
  ```
- [ ] `git add -u && git commit -m "Add QuickHub Capture"`
- [ ] Push → PR 作成
- [ ] テンプレートのチェックリストをすべて ✅
- [ ] レビュー指摘があれば修正 → 再 push
- [ ] マージ確認

---

## 7. モバイル環境での実運用

### 目的
実際の iPhone/iPad でエンドツーエンド動作を検証し UX を確立する。

### タスク
- [ ] iPhone/iPad で Vault を Git clone（Private repo なら PAT を入力）
- [ ] `Files` → `Vault/.obsidian/plugins/` に `QuickHub Capture` フォルダを AirDrop
  - 公開後はストアから直接インストール可
- [ ] モバイル側でプラグインを有効化 → PAT / Repo を再入力
- [ ] ショートカットを共有リンクから追加
  - Back Tap やウィジェットに割り当てて "2 Tap 送信" を実現
- [ ] 実際にクイックメモを送信し、Obsidian に反映されることを確認

---

## 8. 保守 & 今後の拡張アイデア（任意）

### タスク
- [ ] Dependabot で npm / GH Actions 更新 (`.github/dependabot.yml`)
- [ ] Release WF で `generate_release_notes: true` を有効化
- [ ] GitHub Discussions を有効化しフィードバック経路を整備
- [ ] 画像 / PDF 添付（GitHub Upload API → CDN URL）を調査
- [ ] Web 全文クリップ（jina.ai / Mercury）を調査
- [ ] ハイライト集約（Kindle → ショートカット共有 → プラグイン追記）

---

### 進捗可視化

GitHub では Markdown のチェックボックスがプルリクの "Files changed" 画面等でもレンダリングされるため、
このファイルを編集するだけで常に最新の進捗を共有できます。
