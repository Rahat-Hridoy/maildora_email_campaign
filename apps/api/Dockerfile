FROM node:20-alpine AS builder
RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

COPY packages/queue ./packages/queue
COPY apps/api/package.json ./
COPY apps/api/src ./src
COPY apps/api/prisma ./prisma
COPY apps/api/tsconfig.json ./
COPY apps/api/tsconfig.build.json ./
COPY apps/api/nest-cli.json ./

# @maildora/queue আগে local install, তারপর বাকি সব
RUN npm install ./packages/queue
RUN npm install --ignore-scripts
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
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/packages ./packages

EXPOSE 4000
CMD ["node", "dist/src/main.js"]
