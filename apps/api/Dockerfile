FROM oven/bun:1
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/api ./apps/api
COPY packages/db ./packages/db

RUN bun install
RUN bunx prisma migrate deploy --config=packages/db/prisma.config.ts
RUN bunx prisma generate --config=packages/db/prisma.config.ts

WORKDIR /app/apps/api

EXPOSE 3000
CMD ["bun", "run", "index.ts"]
