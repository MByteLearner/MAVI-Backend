# ---------- Stage 1: Build ----------
FROM node:22-alpine AS build
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------- Stage 2: Runtime ----------
FROM node:22-alpine
RUN apk add --no-cache openssl libc6-compat
ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# Cliente Prisma generado + esquema (necesario para db push en el arranque)
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma
COPY --from=build /app/dist ./dist

EXPOSE 3000
# db push sincroniza el esquema al arrancar (usar migraciones formales en producción)
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/index.js"]
