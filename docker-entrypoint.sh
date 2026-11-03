#!/bin/sh
set -e

# Starts as root only to hand the mounted folders to PUID:PGID — they may still belong to
# root from an older image — and then continues as that user, so the app never runs as root.
if [ "$(id -u)" = "0" ]; then
    PUID="${PUID:-1000}"
    PGID="${PGID:-1000}"
    chown -R "$PUID:$PGID" /app/data /app/backups
    exec su-exec "$PUID:$PGID" "$0" "$@"
fi

node_modules/.bin/prisma migrate deploy
exec node app.js
