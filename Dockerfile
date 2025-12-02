# ==========
# ビルドステージ
# ==========
FROM node:22-slim AS build

WORKDIR /app

# 依存関係をインストール
COPY package*.json tsconfig.json ./
RUN npm ci

# ソースをコピーしてビルド
COPY src ./src
RUN npm run build

# ==========
# 実行ステージ
# ==========
FROM node:22-slim AS runner

WORKDIR /app

# 本番用依存関係のみインストール
COPY package*.json ./
RUN npm ci --omit=dev

# ビルド済みファイルをコピー
COPY --from=build /app/dist ./dist

# public を見るコード（server.ts）がある場合に備えて、
# コンテナ内の /app/public を使う想定
# ※ 実際のファイルは docker-compose 側からマウントします

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/server.js"]
