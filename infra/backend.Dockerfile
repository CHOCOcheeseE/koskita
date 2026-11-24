# Image backend KosKita. Context build: apps/backend (lihat infra/docker-compose.yml).

FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
USER node
EXPOSE 3000
# prisma CLI ada di devDependencies, jadi migrasi dijalankan lewat npx versi yang sama dengan @prisma/client.
CMD ["sh", "-c", "npx --yes prisma@$(node -p \"require('@prisma/client/package.json').version\") migrate deploy && node dist/main.js"]
