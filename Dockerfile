FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

# Full install (not --production): the prisma CLI is a devDependency but is also
# needed at container start to run "prisma migrate deploy" against the SQLite volume.
RUN npm install
RUN npx prisma generate

COPY . .

# Sane defaults matching the mounted volumes below — SESSION_SECRET is generated into
# the data volume if unset, BASE_URL is only needed for sub-path deployments. NODE_ENV
# stays below "npm install" because the prisma CLI is a devDependency (see above).
ENV NODE_ENV=production
ENV DATABASE_URL="file:../data/bookmarkranger.db"
ENV PORT=3099

EXPOSE 3099

CMD ["sh", "-c", "npx prisma migrate deploy && node app.js"]
