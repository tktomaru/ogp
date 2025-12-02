// src/server.ts
import express from 'express';
import path from 'path';
import { randomUUID } from 'crypto';

const app = express();

// 画像の総数（1〜TOTAL_IMAGES）
const TOTAL_IMAGES = 1000;

// ポート & サイトのOrigin
const PORT = Number(process.env.PORT) || 3000;
const SITE_ORIGIN =
  process.env.SITE_ORIGIN ?? `http://localhost:${PORT}`;

/**
 * UUIDなどの文字列から 1〜max のインデックスを決める簡易ハッシュ
 * 同じ URL にアクセスすれば毎回同じ画像番号になります。
 */
function hashToImageIndex(str: string, max: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  const positive = Math.abs(hash);
  return (positive % max) + 1; // 1〜max
}

// 日本語ランダム文字列を生成するヘルパー
function generateRandomJapanese(length: number): string {
  // 好きな文字を足してOK（ひらがな・カタカナ・漢字など）
  const chars =
    'あいうえおかきくけこさしすせそたちつてとなにぬねの' +
    'はひふへほまみむめもやゆよらりるれろわをん' +
    'アイウエオカキクケコサシスセソタチツテトナニヌネノ' +
    'ハヒフヘホマミムメモヤユヨラリルレロワヲン' +
    '日月火水木金土山川田東京大阪愛楽速静安新古';

  let result = '';
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * chars.length);
    result += chars[idx];
  }
  return result;
}

/** HTMLエスケープ（最低限） */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 与えられた uuid1/uuid2 から OGP 用 HTML を生成する共通関数
 */
function buildOgpHtml(uuid1: string, uuid2: string): string {
  // uuid2 から画像番号を決定（URLごとに固定の「ランダムっぽい」画像）
  const imageIndex = hashToImageIndex(uuid2, TOTAL_IMAGES);
  const padded = String(imageIndex).padStart(4, '0'); // 0001〜1000

  const pageUrl = `${SITE_ORIGIN}/ogp/${uuid1}/${uuid2}`;
  const imageUrl = `${SITE_ORIGIN}/images/ogp/${padded}.png`; // 画像は public/images/ogp/0001.png〜 を想定

  const randomJapanese = generateRandomJapanese(10);
  const title = '固定タイトル：' + randomJapanese;
  // ベースの特殊文字部分
  const baseDescription =
    '特殊文字テスト: & < > " \' ! # $ % ( ) * + , - . / : ; = ? @ [ ] ^ _ { | } ~';
  // ランダムな日本語10文字を付与
  const description = baseDescription + randomJapanese;
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />

  <!-- OGP -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(pageUrl)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">

  <!-- Twitterなど -->
  <meta name="twitter:card" content="summary_large_image">
</head>
<body>
  <main style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f5f5f5;">
    <div style="text-align:center;background:#fff;border-radius:16px;padding:32px 40px;box-shadow:0 10px 30px rgba(0,0,0,0.08);max-width:640px;">
      <h1 style="font-size:24px;margin-bottom:16px;">${escapeHtml(title)}</h1>
      <p style="color:#555;margin-bottom:24px;">${escapeHtml(description)}</p>
      <p style="font-size:14px;color:#888;">
        このページはシェア用のOGPページです。<br />
        URL: <code>${escapeHtml(pageUrl)}</code>
      </p>
      <div style="margin-top:24px;">
        <img src="${escapeHtml(imageUrl)}" alt="OGP Image" style="max-width:100%;border-radius:8px;" />
        <p style="margin-top:8px;font-size:12px;color:#666;">画像番号: #${imageIndex} （/images/ogp/${padded}.png）</p>
      </div>
    </div>
  </main>
</body>
</html>`;
}

/**
 * /ogp にアクセスされたとき：
 * UUID を2つ生成して /ogp/:uuid1/:uuid2 に 302 リダイレクト
 */
app.get('/ogp', (req, res) => {
  const uuid1 = randomUUID();
  const uuid2 = randomUUID();

  res.redirect(302, `/ogp/${uuid1}/${uuid2}`);
});

/**
 * /ogp/:uuid1/ にアクセスされたときに
 * OGPメタタグ入りのHTMLを返す
 */
app.get('/ogp/:uuid1', (req, res) => {
  const uuid2 = randomUUID();
  const { uuid1 } = req.params;

  const html = buildOgpHtml(uuid1, uuid2);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});


/**
 * /ogp/:uuid1/:uuid2 にアクセスされたときに
 * OGPメタタグ入りのHTMLを返す
 */
// app.get('/ogp/:uuid1/:uuid2', (req, res) => {
//   const { uuid1, uuid2 } = req.params;

//   const html = buildOgpHtml(uuid1, uuid2);

//   res.setHeader('Content-Type', 'text/html; charset=utf-8');
//   res.send(html);
// });

/**
 * 静的ファイル配信（Reactビルド & 画像など）
 * ビルド先によってパスを合わせてください。
 * - Viteなら: public（この例）
 * - ビルド済みSPAを配信するなら dist など
 */
const publicDir = path.join(__dirname, '..', 'public');
// Viteのdistを使う場合は↓に差し替え
// const publicDir = path.join(__dirname, '..', 'dist');

app.use(express.static(publicDir));

/**
 * それ以外のパス
 */
app.get('*', (req, res) => {
  // res.sendFile(path.join(publicDir, 'index.html'));
  const uuid1 = randomUUID();

  res.redirect(302, `/ogp/${uuid1}`);
});

app.listen(PORT, () => {
  console.log(`Server started on ${SITE_ORIGIN}`);
});
