FROM node:22-alpine

WORKDIR /app

COPY . .

RUN corepack enable && corepack pnpm install --frozen-lockfile

EXPOSE 4001

CMD ["corepack", "pnpm", "--filter", "@ofd-keychain/render-worker", "dev"]
