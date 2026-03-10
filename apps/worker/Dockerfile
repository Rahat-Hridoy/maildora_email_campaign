FROM node:20-alpine AS builder
RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

COPY packages/queue ./packages/queue
COPY apps/worker/package.json ./
COPY apps/worker/tsconfig.json ./
COPY apps/worker/src ./src
COPY apps/api/prisma ./prisma

RUN npm install ./packages/queue
RUN npm install

RUN npx prisma generate
RUN npm run build

# ─── Runner ───
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/packages ./packages

ENV NODE_ENV=production
CMD ["node", "dist/main.js"]
