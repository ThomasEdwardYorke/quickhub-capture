# QuickHub Capture

## 概要 (About)

iOSのショートカットからGitHub経由でObsidianにクイックメモを送信・自動取り込みできるプラグインです。

## 機能 (Features)
- iOS/iPadOSのショートカットから1タップでメモ送信
- GitHubリポジトリのinboxディレクトリにメモを一時保存
- Obsidian起動時や手動同期でメモをVaultに自動取り込み
- 取り込み後はGitHub側のメモを自動削除（リポジトリが散らからない）
- 自動同期タイマー・リボンアイコン・コマンド登録
- 設定画面からPATや保存先フォルダなどを簡単に管理

## インストール
1. [Releasesページ](https://github.com/ThomasEdwardYorke/quickhub-capture/releases)から `quickhub-capture.zip` をダウンロード
2. ZIPを解凍し、`main.js` `manifest.json` `styles.css` を `Vault/.obsidian/plugins/quickhub-capture/` に配置
3. Obsidianの設定 > コミュニティプラグイン で「QuickHub Capture」を有効化

## セットアップ
1. **GitHub PAT（Personal Access Token）を作成**
   - [GitHubのPAT作成ページ](https://github.com/settings/tokens)で `contents:write` 権限のみ付与
2. **設定画面で各項目を入力**
   - GitHub Token: 上記PAT
   - リポジトリ: `username/repo` 形式
   - Inboxディレクトリ: 例 `quick-inbox`
   - Vault保存先フォルダ: 例 `Inbox`
   - 自動同期ON/OFFや間隔も設定可能

## iOSショートカット
- [iCloudリンク](#)（※実際のリンクを記載）からショートカットを追加
- 30秒で分かる導入GIFも参照
- Back Tapやウィジェットに割り当てれば「2タップ送信」も実現

## セキュリティ
- PATは `contents:write` のみに限定
- `.obsidian/plugins-data/` など個人データは `.gitignore` 推奨

## どんな人向け？
- スマホからObsidianに素早くメモを送りたい
- GitHub経由なのでどこからでも安全・確実に同期


---

## FAQ・トラブルシュート（任意）
- Q: メモが取り込まれない場合は？
  - A: PATやリポジトリ設定、inboxディレクトリ名を再確認してください
- Q: iOSショートカットが動かない場合は？
  - A: iCloudリンクの再取得やショートカットの権限設定を見直してください

---

## ライセンス
MIT License
