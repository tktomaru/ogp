// src/generateOgpImages.ts
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas } from 'canvas';

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'ogp');
const TOTAL_IMAGES = 1000;

function ensureOutputDir() {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function getImagePath(index: number): string {
  const fileName = `${String(index).padStart(4, '0')}.png`;
  return path.join(OUTPUT_DIR, fileName);
}

function generateSingleImage(index: number) {
  const width = 1200;
  const height = 630;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 背景
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, width, height);

  // 下の帯
  ctx.fillStyle = '#222222';
  ctx.fillRect(0, height - 80, width, 80);

  // 中央の番号
  const text = String(index);
  ctx.fillStyle = '#222222';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 260px sans-serif';

  const textX = width / 2;
  const textY = height / 2 - 20;
  ctx.fillText(text, textX, textY);

  // 下部ラベル
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`OGP IMAGE #${index}`, 40, height - 40);

  const buffer = canvas.toBuffer('image/png');
  const outPath = getImagePath(index);
  writeFileSync(outPath, buffer);
}

export function generateOgpImagesIfNeeded() {
  console.log('[OGP] 画像生成チェックを開始します…');

  ensureOutputDir();

  let created = 0;
  for (let i = 1; i <= TOTAL_IMAGES; i++) {
    const p = getImagePath(i);
    if (existsSync(p)) continue;
    generateSingleImage(i);
    created++;
  }

  console.log(`[OGP] 画像生成完了: 新規作成 ${created} 枚 / 合計 ${TOTAL_IMAGES} 枚`);
}

// CLIとして直接実行されたときだけ動かしたい場合
generateOgpImagesIfNeeded();
