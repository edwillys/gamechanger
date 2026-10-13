#!/usr/bin/env bash
# Builds "The Game Changer.app" for the architecture of this Mac into dist/.
# usage: npm run package
set -euo pipefail

cd "$(dirname "$0")/.."

[ "$(uname -s)" = "Darwin" ] || { echo "This script builds the macOS app and has to run on macOS." >&2; exit 1; }

case "$(uname -m)" in
    arm64) ARCH=arm64 ;;
    x86_64) ARCH=x64 ;;
    *) echo "Unsupported architecture: $(uname -m)" >&2; exit 1 ;;
esac

NAME="The Game Changer"
ELECTRON_VERSION="$(node -p "try { require('./node_modules/electron/package.json').version } catch (e) { '11.5.0' }")"
USB_VERSION="$(node -p "require('./package.json').dependencies.usb")"
HID_VERSION="$(node -p "require('./package.json').dependencies['node-hid']")"

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

# Stage only what the app needs at runtime. Packaging the project folder itself would also bundle the
# build tooling in node_modules (about 20 times the size), and the native modules have to be installed
# for this Mac's architecture.
cp -R main.js preload.js app.html media LICENSE README.md "$STAGE/"
find "$STAGE" -name CLAUDE.md -delete
cat > "$STAGE/package.json" <<EOF
{
  "name": "the-game-changer",
  "productName": "$NAME",
  "version": "$(node -p "require('./package.json').version")",
  "description": "The Gamechanger",
  "main": "main.js",
  "author": "Edgar Lubicz",
  "license": "MIT",
  "dependencies": {
    "usb": "$USB_VERSION",
    "node-hid": "$HID_VERSION"
  }
}
EOF
(cd "$STAGE" && npm install --omit=dev --no-audit --no-fund)

# the icon path is given without extension; the packager adds .icns itself
# (asar is off so the native modules can be loaded from disk)
npx --yes @electron/packager@18.4.4 "$STAGE" "$NAME" \
    --platform=darwin --arch="$ARCH" --electron-version="$ELECTRON_VERSION" \
    --out=dist --overwrite --no-asar \
    --icon="$PWD/build/icon" \
    --app-bundle-id=com.ulritter.gamechanger \
    --app-version="$(node -p "require('./package.json').version")"

# the packager's signature is invalid once the bundle was modified, which Apple Silicon does not accept
APP="dist/$NAME-darwin-$ARCH/$NAME.app"
codesign --force --deep --sign - --identifier com.ulritter.gamechanger "$APP"
codesign --verify --deep --strict "$APP"

echo
echo "Built: $APP"
