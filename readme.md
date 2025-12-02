# Web Tools OGP Server

Web Tools サイト向けの **OGP 専用バックエンド** です。  
Node.js (Express + TypeScript) で実装されたシンプルな API と、Apache からのリバースプロキシ構成を前提としています。

- `GET /ogp`  
  → サーバ側で UUID を 2 つ生成し、`/ogp/:uuid1` にリダイレクト
- `GET /ogp/:uuid1`  
  → OGP 用の `<meta property="og:*">` を含む HTML を返す
- `public/index.html`  
  → Apache からそのまま配信されるトップページ（簡易説明 + `/ogp` へのリンク）
- `public/images/ogp/0001.png`〜`1000.png`  
  → 事前生成しておく OGP 画像

---

## 機能概要

### 1. OGP HTML 生成

`src/server.ts` で Express サーバを起動し、以下のエンドポイントを提供します。

#### `GET /ogp`

- サーバ側で `uuid1`, `uuid2` を `crypto.randomUUID()` で生成
- `302 Found` で `/ogp/:uuid1` にリダイレクト

#### `GET /ogp/:uuid1`

- `uuid2` をもとに簡易ハッシュを計算し、`1〜1000` の画像番号を決定  
  → `public/images/ogp/0001.png`〜`1000.png` から 1 枚を選択
- OGP 用 HTML を生成し、以下を `<head>` に埋め込みます

  - `<title>`：固定タイトル
  - `<meta name="description">`
  - `<meta property="og:title">`
  - `<meta property="og:description">`
  - `<meta property="og:url">`
  - `<meta property="og:image">`
  - `<meta name="twitter:card">`

- description は毎回次の形式で生成されます。

```text
  特殊文字テスト: & < > " ' ! # $ % ( ) * + , - . / : ; = ? @ [ ] ^ _ { | } ~ + ランダムな日本語10文字
````

※ ランダムな日本語 10 文字は、ひらがな／カタカナ／いくつかの漢字からランダムに選択されます。

### 2. OGP 画像の事前生成

`canvas` パッケージを使って、起動前に 1〜1000 までの番号付き画像を生成します。

* 入出力

  * 入力: 特になし（単純に `1..1000` をループ）
  * 出力: `public/images/ogp/0001.png`〜`public/images/ogp/1000.png`

* スクリプト

  * `src/generateOgpImages.ts`

* 実行コマンド

  ```bash
  npm run generate:ogp-images
  ```

---

## 動作環境

* Node.js 22 系
* npm 10 以降
* TypeScript 5 系
* ネイティブモジュール `canvas` をビルドするための環境（OS によって異なります）

  * Linux: `python`, `g++`, `make`, `pkg-config`, `libcairo2-dev` 等
  * Windows / macOS: それぞれの OS に応じた build tools

Docker を利用する場合は、Dockerfile 内で必要な依存関係をインストールすることを想定しています。

---

## セットアップ & ローカル実行

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. OGP 画像の生成

```bash
npm run generate:ogp-images
```

実行後、`public/images/ogp/0001.png`〜`1000.png` が生成されます。

### 3. 開発サーバの起動（TypeScript のまま実行）

```bash
npm run dev
```

* デフォルトでは `http://localhost:3000` で待ち受けます。
* `SITE_ORIGIN` を指定したい場合は、環境変数で上書きできます。

```bash
SITE_ORIGIN="http://localhost:8080" npm run dev
```

### 4. ビルド & 本番サーバの起動

```bash
npm run build
npm start
```

---

## エンドポイント一覧

| メソッド | パス                   | 説明                                                  |
| ---- | -------------------- | --------------------------------------------------- |
| GET  | `/ogp`               | UUID を 2 つ生成し、`/ogp/:uuid1/:uuid2` にリダイレクト          |
| GET  | `/ogp/:uuid1` | OGP メタタグ入り HTML を返す                                 |
| GET  | `/` ほか静的ファイル         | `public/` 配下をそのまま返す（Apache または Express の static 配信） |


## メモ

* このリポジトリはあくまで OGP 専用のバックエンド＋静的トップページを提供するものです。
* Teams / Slack / X などのクローラは JavaScript を実行しないため、**本サーバが返す静的 HTML 内の `<meta property="og:*">` のみが OGP として利用されます**。

