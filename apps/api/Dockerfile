# Standalone API image — build from apps/api directory:
#   docker build -t windowofhonor-api:1.0.0 -f Dockerfile .

FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl

COPY package.json ./
RUN npm install

COPY prisma ./prisma
COPY tsconfig.json nest-cli.json ./
COPY src ./src

RUN npx prisma generate && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -g 1001 -S honor && adduser -S honor -u 1001 -G honor \
  && apk add --no-cache wget openssl

COPY --from=builder /app/package.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

USER honor
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
