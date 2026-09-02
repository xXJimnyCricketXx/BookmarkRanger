FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

# Full install (not --production): the prisma CLI is a devDependency but is also
# needed at container start to run "prisma migrate deploy" against the SQLite volume.
RUN npm install
RUN npx prisma generate

COPY . .

# Sane defaults matching the mounted volumes below — override SESSION_SECRET (no
# safe default exists) and BASE_URL (only needed for sub-path deployments).
ENV DATABASE_URL="file:../data/bookmarkranger.db"
ENV PORT=3099

EXPOSE 3099

CMD ["sh", "-c", "npx prisma migrate deploy && node app.js"]
