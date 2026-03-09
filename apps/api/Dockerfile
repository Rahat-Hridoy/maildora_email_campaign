# apps/api/Dockerfile

FROM node:20-alpine AS builder

WORKDIR /app

COPY apps/api/package.json ./package.json

RUN npm install

COPY apps/api/src ./src
COPY apps/api/prisma ./prisma
COPY apps/api/tsconfig.json ./tsconfig.json
COPY apps/api/tsconfig.build.json ./tsconfig.build.json
COPY apps/api/nest-cli.json ./nest-cli.json

RUN npx prisma generate

RUN npm run build

# ─── Runner ───
FROM node:20-alpine AS runner

WORKDIR /app

COPY apps/api/package.json ./package.json

RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 4000

CMD ["node", "dist/main.js"]