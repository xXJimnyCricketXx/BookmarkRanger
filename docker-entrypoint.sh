#!/bin/sh
set -e

# Without PUID/PGID the data folder keeps its owner, so an update that loses these variables
# can't silently change who owns the files. Only a root-owned or new folder falls back to 1000.
current_owner() {
    owner="$(stat -c "$1" /app/data)"
    if [ "$owner" = "0" ]; then echo 1000; else echo "$owner"; fi
}

# Starts as root only to hand the mounted folders to PUID:PGID — they may still belong to
# root from an older image — and then continues as that user, so the app never runs as root.
if [ "$(id -u)" = "0" ]; then
    PUID="${PUID:-$(current_owner %u)}"
    PGID="${PGID:-$(current_owner %g)}"
    chown -R "$PUID:$PGID" /app/data /app/backups
    exec su-exec "$PUID:$PGID" "$0" "$@"
fi

node_modules/.bin/prisma migrate deploy
exec node app.js
