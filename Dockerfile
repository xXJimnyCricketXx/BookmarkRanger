FROM node:24-alpine

RUN apk add --no-cache su-exec

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

# Full install (not --production): the prisma CLI is a devDependency but is also
# needed at container start to run "prisma migrate deploy" against the SQLite volume.
RUN npm ci

COPY . .
RUN npx prisma generate
RUN chmod +x docker-entrypoint.sh

# Sane defaults matching the mounted volumes below — SESSION_SECRET is generated into
# the data volume if unset, BASE_URL is only needed for sub-path deployments. NODE_ENV
# stays below "npm install" because the prisma CLI is a devDependency (see above).
ENV NODE_ENV=production
ENV DATABASE_URL="file:../data/bookmarkranger.db"
ENV PORT=3099
ENV HOME=/tmp
ENV CHECKPOINT_DISABLE=1

EXPOSE 3099

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" > /dev/null || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
