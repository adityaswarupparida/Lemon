FROM oven/bun:1
ARG DATABASE_URL

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/api ./apps/api
COPY packages/db ./packages/db

RUN bun install
RUN DATABASE_URL=$DATABASE_URL bunx prisma generate --schema=packages/db/prisma/schema.prisma

WORKDIR /app/apps/api

EXPOSE 3000
CMD ["bun", "run", "index.ts"]
