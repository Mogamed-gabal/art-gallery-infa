# Multi-stage production build for NestJS Backend
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@10.4.1

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build
RUN pnpm prune --prod

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3005

CMD ["node", "dist/main"]
