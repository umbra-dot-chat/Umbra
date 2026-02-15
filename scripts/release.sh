#!/bin/bash
#
# Bump the app version across all config files, commit, tag, and push to
# trigger the Release App workflow on GitHub Actions.
#
# Usage:
#   ./scripts/release.sh <version>
#   ./scripts/release.sh 1.2.0
#   ./scripts/release.sh patch        # auto-bump patch (1.1.0 -> 1.1.1)
#   ./scripts/release.sh minor        # auto-bump minor (1.1.0 -> 1.2.0)
#   ./scripts/release.sh major        # auto-bump major (1.1.0 -> 2.0.0)
#

set -euo pipefail

UMBRA_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$UMBRA_DIR"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info()  { echo -e "${CYAN}[release]${NC} $*"; }
ok()    { echo -e "${GREEN}[release]${NC} $*"; }
warn()  { echo -e "${YELLOW}[release]${NC} $*"; }
err()   { echo -e "${RED}[release]${NC} $*" >&2; }

# Read current version from package.json
current_version() {
  node -p "require('./package.json').version"
}

# Bump a semver component: bump_semver <version> <major|minor|patch>
bump_semver() {
  local ver="$1" part="$2"
  IFS='.' read -r major minor patch <<< "$ver"
  case "$part" in
    major) echo "$((major + 1)).0.0" ;;
    minor) echo "${major}.$((minor + 1)).0" ;;
    patch) echo "${major}.${minor}.$((patch + 1))" ;;
    *)     err "Unknown bump type: $part"; exit 1 ;;
  esac
}

# ---------------------------------------------------------------------------
# Validate
# ---------------------------------------------------------------------------

if [ $# -lt 1 ]; then
  echo "Usage: $0 <version|major|minor|patch>"
  echo ""
  echo "  $0 1.2.0     Set version to 1.2.0"
  echo "  $0 patch      Bump patch  ($(current_version) -> $(bump_semver "$(current_version)" patch))"
  echo "  $0 minor      Bump minor  ($(current_version) -> $(bump_semver "$(current_version)" minor))"
  echo "  $0 major      Bump major  ($(current_version) -> $(bump_semver "$(current_version)" major))"
  exit 1
fi

# Ensure clean working tree
if [ -n "$(git status --porcelain)" ]; then
  err "Working tree is dirty. Commit or stash changes first."
  git status --short
  exit 1
fi

# Ensure we're on main
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
  warn "You're on branch '$BRANCH', not 'main'."
  read -p "Continue anyway? [y/N] " -n 1 -r
  echo
  [[ $REPLY =~ ^[Yy]$ ]] || exit 1
fi

# ---------------------------------------------------------------------------
# Resolve version
# ---------------------------------------------------------------------------

CURRENT=$(current_version)
INPUT="$1"

case "$INPUT" in
  major|minor|patch)
    NEW_VERSION=$(bump_semver "$CURRENT" "$INPUT")
    ;;
  *)
    # Validate semver format
    if ! echo "$INPUT" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
      err "Invalid version format: '$INPUT'. Expected X.Y.Z"
      exit 1
    fi
    NEW_VERSION="$INPUT"
    ;;
esac

TAG="v${NEW_VERSION}"

# Check if tag already exists
if git rev-parse "$TAG" >/dev/null 2>&1; then
  err "Tag $TAG already exists locally."
  exit 1
fi

if git ls-remote --tags origin "$TAG" | grep -q "$TAG"; then
  err "Tag $TAG already exists on remote."
  exit 1
fi

info "Bumping version: ${CURRENT} -> ${NEW_VERSION} (tag: ${TAG})"
echo ""

# ---------------------------------------------------------------------------
# Update version in all config files
# ---------------------------------------------------------------------------

# 1) package.json
info "Updating package.json"
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '${NEW_VERSION}';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# 2) src-tauri/tauri.conf.json
info "Updating src-tauri/tauri.conf.json"
node -e "
const fs = require('fs');
const conf = JSON.parse(fs.readFileSync('src-tauri/tauri.conf.json', 'utf8'));
conf.version = '${NEW_VERSION}';
fs.writeFileSync('src-tauri/tauri.conf.json', JSON.stringify(conf, null, 2) + '\n');
"

# 3) src-tauri/Cargo.toml
info "Updating src-tauri/Cargo.toml"
sed -i.bak "s/^version = \".*\"/version = \"${NEW_VERSION}\"/" src-tauri/Cargo.toml
rm -f src-tauri/Cargo.toml.bak

# 4) hooks/useAppUpdate.ts
info "Updating hooks/useAppUpdate.ts"
sed -i.bak "s/const APP_VERSION = '.*'/const APP_VERSION = '${NEW_VERSION}'/" hooks/useAppUpdate.ts
rm -f hooks/useAppUpdate.ts.bak

echo ""

# ---------------------------------------------------------------------------
# Commit, tag, push
# ---------------------------------------------------------------------------

info "Staging files..."
git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml hooks/useAppUpdate.ts

info "Committing..."
git commit -m "chore: bump version to ${NEW_VERSION}"

info "Tagging ${TAG}..."
git tag "$TAG"

info "Pushing to origin..."
git push origin "$(git branch --show-current)" --tags

echo ""
ok "Release ${TAG} pushed! GitHub Actions will build and publish the release."
ok "Monitor: https://github.com/InfamousVague/Umbra/actions"
