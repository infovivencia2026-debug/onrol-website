#!/usr/bin/env bash
# Deploys this Vite static build to the Hostinger VPS.
# Usage: ./scripts/deploy.sh   (or `npm run deploy`)
# Override anything via env vars (.env is auto-loaded).
set -euo pipefail

# ─── Load .env ───────────────────────────────────────────────
if [ -f .env ]; then
  set -a; source .env; set +a
fi

VPS_HOST="${SSH_USER:-root}@${SSH_HOST:-76.13.242.93}"
VPS_PORT="${SSH_PORT:-22}"
VPS_PATH="${SSH_REMOTE_PATH:-/home/onrol.in/public_html}"
SSH_KEY="${SSH_KEY_PATH:-$HOME/.ssh/id_ed25519}"
BUILD_CMD="${BUILD_CMD:-npm run build}"
DIST_DIR="${DIST_DIR:-dist}"

# Convert Windows path to Git-Bash form if needed
case "$SSH_KEY" in
  [a-zA-Z]:\\*|[a-zA-Z]:/*)
    drive=$(echo "$SSH_KEY" | cut -c1 | tr 'A-Z' 'a-z')
    rest=$(echo "$SSH_KEY" | sed 's|^[a-zA-Z]:||; s|\\|/|g')
    SSH_KEY="/$drive$rest"
    ;;
esac

SSH_OPTS=(-p "$VPS_PORT" -o StrictHostKeyChecking=accept-new)
SCP_OPTS=(-P "$VPS_PORT" -O -o StrictHostKeyChecking=accept-new)
if [ -n "${SSH_KEY:-}" ] && [ -f "$SSH_KEY" ]; then
  SSH_OPTS+=(-i "$SSH_KEY")
  SCP_OPTS+=(-i "$SSH_KEY")
fi

# ─── Build ────────────────────────────────────────────────────
echo "→ building ($BUILD_CMD)"
$BUILD_CMD

if [ ! -d "$DIST_DIR" ]; then
  echo "✗ $DIST_DIR not found after build" >&2
  exit 1
fi

# Stamp version.json so the live site reports the correct build
APP_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "0.0.0")
cat > "$DIST_DIR/version.json" <<JSON
{"version":"$APP_VERSION","apk":"https://onrol.in/downloads/onrol.apk","notes":"Latest ONROL release"}
JSON
echo "→ stamped $DIST_DIR/version.json: $APP_VERSION"

# ─── Pack ─────────────────────────────────────────────────────
TARBALL="/tmp/onrol-dist-$(date +%s).tar.gz"
echo "→ packing $DIST_DIR/ → $TARBALL"
tar -czf "$TARBALL" -C "$DIST_DIR" .
echo "  archive: $(du -h "$TARBALL" | cut -f1)"

# ─── Upload + extract + restart (none — it's static) ──────────
REMOTE_TARBALL="/tmp/$(basename "$TARBALL")"
echo "→ scp → $VPS_HOST:$REMOTE_TARBALL"
scp "${SCP_OPTS[@]}" "$TARBALL" "$VPS_HOST:$REMOTE_TARBALL"

echo "→ extracting on VPS"
# Strategy: wipe only Vite's hashed chunk dir (assets/) to prevent unbounded bloat,
# then overlay the new build on top. Files we don't manage (updates/, st/,
# node_modules_old/, brand-kit/, media/, etc.) are left untouched.
ssh "${SSH_OPTS[@]}" "$VPS_HOST" bash -s <<EOF
set -e
mkdir -p "$VPS_PATH"
rm -rf "$VPS_PATH/assets"
tar -xzf "$REMOTE_TARBALL" -C "$VPS_PATH"
rm -f "$REMOTE_TARBALL"
echo "  extracted to $VPS_PATH"
EOF

rm -f "$TARBALL"

# ─── APK + Windows installer (ship if present) ────────────────
APK="android/app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK" ]; then
  echo "→ uploading APK"
  ssh "${SSH_OPTS[@]}" "$VPS_HOST" "mkdir -p $VPS_PATH/downloads"
  scp "${SCP_OPTS[@]}" "$APK" "$VPS_HOST:$VPS_PATH/downloads/onrol.apk"
fi

INSTALLER=$(ls -t release/*Setup*.exe 2>/dev/null | head -1 || true)
if [ -n "$INSTALLER" ]; then
  echo "→ uploading Windows installer ($(basename "$INSTALLER"))"
  ssh "${SSH_OPTS[@]}" "$VPS_HOST" "mkdir -p $VPS_PATH/downloads"
  scp "${SCP_OPTS[@]}" "$INSTALLER" "$VPS_HOST:$VPS_PATH/downloads/onrol-setup.exe"
fi

PORTABLE=$(ls -t release/*.exe 2>/dev/null | grep -viE 'setup|uninstall' | head -1 || true)
if [ -n "$PORTABLE" ]; then
  echo "→ uploading portable exe ($(basename "$PORTABLE"))"
  ssh "${SSH_OPTS[@]}" "$VPS_HOST" "mkdir -p $VPS_PATH/downloads"
  scp "${SCP_OPTS[@]}" "$PORTABLE" "$VPS_HOST:$VPS_PATH/downloads/onrol-portable.exe"
fi

# ─── Verify ───────────────────────────────────────────────────
echo "→ checking https://onrol.in"
HTTP=$(curl -s -o /dev/null -w '%{http_code}' https://onrol.in || echo "ERR")
echo "  HTTP $HTTP"
echo "✓ deployed"
