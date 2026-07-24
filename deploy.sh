#!/bin/sh
# Pulls the latest commit and syncs it into the Apache webroot.
# Runs on the Pi via a systemd timer (see deploy-site.timer/.service).
set -e

REPO_DIR="/home/woehrd/pi-profil-website"
WEB_ROOT="/var/www/html"

cd "$REPO_DIR"
git pull --ff-only -q

# Always sync, regardless of whether this run's pull changed HEAD — the
# repo can also move via a manual pull/push outside this script, and an
# unconditional rsync is cheap since it only copies what actually differs.
sudo rsync -a --delete \
  --exclude='.git' --exclude='.gitignore' --exclude='README.md' \
  --exclude='.claude' --exclude='deploy.sh' --exclude='status.json' \
  "$REPO_DIR"/ "$WEB_ROOT"/
sudo chown -R www-data:www-data "$WEB_ROOT"
echo "$(date -Is) deployed $(git rev-parse HEAD)"
