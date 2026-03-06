#!/bin/bash
# =============================================================================
# Umbra Deployment Script
#
# Deploys:
#   - Frontend to umbra.chat
#   - Relay server to relay.umbra.chat
#
# Usage:
#   ./scripts/deploy.sh              # Deploy everything
#   ./scripts/deploy.sh frontend     # Deploy only frontend
#   ./scripts/deploy.sh relay        # Deploy only relay
#   ./scripts/deploy.sh --help       # Show help
#
# Prerequisites:
#   - Fill in .deploy-credentials with your SSH/server info
#   - sshpass installed (for password auth): brew install hudochenkov/sshpass/sshpass
#   - Docker installed on the relay server
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CREDENTIALS_FILE="$PROJECT_ROOT/.deploy-credentials"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# -----------------------------------------------------------------------------
# Helper Functions
# -----------------------------------------------------------------------------

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
    cat << EOF
Umbra Deployment Script

Usage:
    $0 [command] [options]

Commands:
    all             Deploy frontend and all relays (default)
    frontend        Deploy only the frontend to chat.umbra.chat
    relay           Deploy only the primary relay to relay.umbra.chat
    relay-seoul     Deploy only the Seoul relay to seoul.relay.umbra.chat
    relays          Deploy all relay servers (primary + Seoul)

Options:
    --skip-build    Skip the build step (use existing dist/)
    --dry-run       Show what would be done without executing
    --help          Show this help message

Examples:
    $0                      # Deploy everything
    $0 frontend             # Deploy only frontend
    $0 relay --skip-build   # Deploy primary relay without rebuilding
    $0 relay-seoul          # Deploy Seoul relay only
    $0 relays               # Deploy all relays
    $0 --dry-run            # Preview deployment steps

Configuration:
    Edit .deploy-credentials with your SSH credentials and server paths.
    This file is gitignored and will not be committed.

Prerequisites:
    For password authentication, install sshpass:
        brew install hudochenkov/sshpass/sshpass
EOF
}

# -----------------------------------------------------------------------------
# Load Credentials
# -----------------------------------------------------------------------------

load_credentials() {
    if [[ ! -f "$CREDENTIALS_FILE" ]]; then
        log_error "Credentials file not found: $CREDENTIALS_FILE"
        log_info "Please copy .deploy-credentials.example to .deploy-credentials and fill in your values"
        exit 1
    fi

    # Source the credentials file
    source "$CREDENTIALS_FILE"

    # Validate required variables
    local required_vars=("SSH_USER" "FRONTEND_HOST" "FRONTEND_PATH" "RELAY_HOST" "RELAY_PATH")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" || "${!var}" == "your_"* ]]; then
            log_error "Missing or placeholder value for $var in .deploy-credentials"
            exit 1
        fi
    done

    # Determine SSH connection method
    if [[ -n "$SSH_PASSWORD" ]]; then
        # Password authentication - requires sshpass
        if ! command -v sshpass &> /dev/null; then
            log_error "sshpass is required for password authentication"
            log_info "Install with: brew install hudochenkov/sshpass/sshpass"
            exit 1
        fi
        SSH_CMD="sshpass -p '$SSH_PASSWORD' ssh -o StrictHostKeyChecking=no"
        SCP_CMD="sshpass -p '$SSH_PASSWORD' scp -o StrictHostKeyChecking=no"
        RSYNC_SSH="sshpass -p '$SSH_PASSWORD' ssh -o StrictHostKeyChecking=no"
        log_info "Using password authentication"
    elif [[ -n "$SSH_KEY_PATH" ]]; then
        # Key authentication
        SSH_KEY_PATH="${SSH_KEY_PATH/#\~/$HOME}"
        if [[ ! -f "$SSH_KEY_PATH" ]]; then
            log_error "SSH key not found at $SSH_KEY_PATH"
            exit 1
        fi
        SSH_CMD="ssh -i $SSH_KEY_PATH -o StrictHostKeyChecking=no"
        SCP_CMD="scp -i $SSH_KEY_PATH -o StrictHostKeyChecking=no"
        RSYNC_SSH="ssh -i $SSH_KEY_PATH -o StrictHostKeyChecking=no"
        log_info "Using SSH key authentication"
    else
        # Default SSH config
        SSH_CMD="ssh -o StrictHostKeyChecking=no"
        SCP_CMD="scp -o StrictHostKeyChecking=no"
        RSYNC_SSH="ssh -o StrictHostKeyChecking=no"
        log_info "Using default SSH configuration"
    fi

    # Use SSH_HOST if provided, otherwise use the domain names
    FRONTEND_SSH_HOST="${SSH_HOST:-$FRONTEND_HOST}"
    RELAY_SSH_HOST="${SSH_HOST:-$RELAY_HOST}"
}

# -----------------------------------------------------------------------------
# SSH/SCP wrapper functions
# -----------------------------------------------------------------------------

run_ssh() {
    local host="$1"
    shift
    eval "$SSH_CMD $SSH_USER@$host $*"
}

run_rsync() {
    local src="$1"
    local dest="$2"
    rsync -avz --delete -e "$RSYNC_SSH" "$src" "$dest"
}

# Start an SSH ControlMaster for the given host so that multiple
# ssh/rsync calls reuse a single TCP connection instead of opening
# (and potentially getting rate-limited by) many separate ones.
start_ssh_multiplex() {
    local host="$1"
    SSH_CONTROL_DIR=$(mktemp -d)
    SSH_CONTROL_PATH="$SSH_CONTROL_DIR/%r@%h:%p"
    log_info "Opening persistent SSH connection to $host..."
    eval "$SSH_CMD -fNM -o ControlPath='$SSH_CONTROL_PATH' -o ServerAliveInterval=30 -o ServerAliveCountMax=5 $SSH_USER@$host"
}

stop_ssh_multiplex() {
    local host="$1"
    if [[ -n "$SSH_CONTROL_PATH" ]]; then
        eval "$SSH_CMD -O exit -o ControlPath='$SSH_CONTROL_PATH' $SSH_USER@$host 2>/dev/null" || true
        rm -rf "$SSH_CONTROL_DIR" 2>/dev/null || true
    fi
}

# Run rsync reusing the ControlMaster socket when available
run_rsync_mux() {
    local src="$1"
    local dest="$2"
    local extra_ssh_opts=""
    if [[ -n "$SSH_CONTROL_PATH" ]]; then
        extra_ssh_opts="-o ControlPath='$SSH_CONTROL_PATH'"
    fi
    rsync -avz --delete -e "$RSYNC_SSH $extra_ssh_opts" "$src" "$dest"
}

run_ssh_mux() {
    local host="$1"
    shift
    local extra_ssh_opts=""
    if [[ -n "$SSH_CONTROL_PATH" ]]; then
        extra_ssh_opts="-o ControlPath='$SSH_CONTROL_PATH'"
    fi
    eval "$SSH_CMD $extra_ssh_opts $SSH_USER@$host $*"
}

# -----------------------------------------------------------------------------
# Build Functions
# -----------------------------------------------------------------------------

build_frontend() {
    log_info "Building frontend..."
    cd "$PROJECT_ROOT"

    # Sync Wisp design system packages before building
    log_info "Syncing Wisp packages..."
    node scripts/postinstall.js
    log_success "Wisp packages synced"

    # Clean previous build
    rm -rf dist/

    # Build for web using expo
    npx expo export --platform web

    if [[ -d "dist" ]]; then
        log_success "Frontend build complete: dist/"
    else
        log_error "Frontend build failed - dist/ not created"
        exit 1
    fi
}

build_relay() {
    log_info "Building relay Docker image on server..."
    # We'll build on the server, not locally
}

# -----------------------------------------------------------------------------
# Deploy Functions
# -----------------------------------------------------------------------------

generate_nginx_config() {
    # Generate an nginx site config into a local temp file.
    # Called by deploy_frontend — the file is rsynced to the server.
    local outfile="$1"
    cat > "$outfile" << EOF
server {
    listen 80;
    server_name ${FRONTEND_HOST};

    root ${FRONTEND_PATH};
    index index.html;

    # ── MIME types ────────────────────────────────────────────────────
    # Ensure .wasm and .js files are served with correct Content-Type.
    # nginx's default mime.types usually covers .js but not .wasm.
    types {
        application/wasm                wasm;
        application/javascript          js mjs;
        text/html                       html htm;
        text/css                        css;
        application/json                json;
        image/png                       png;
        image/jpeg                      jpg jpeg;
        image/svg+xml                   svg svgz;
        image/x-icon                    ico;
        font/woff                       woff;
        font/woff2                      woff2;
        application/octet-stream        bin;
    }

    # ── Static assets ─────────────────────────────────────────────────
    # Expo hashes JS bundles into _expo/static/. Cache aggressively.
    location /_expo/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    # Serve WASM and JS files with COOP/COEP headers (required for
    # SharedArrayBuffer which some WASM workloads need).
    location ~ \.(wasm|js)$ {
        add_header Cross-Origin-Opener-Policy "same-origin";
        add_header Cross-Origin-Embedder-Policy "require-corp";
        try_files \$uri =404;
    }

    # ── Download / marketing site (Next.js static export) ───────────
    location /download {
        try_files \$uri \$uri/ \$uri.html /download/index.html;
    }

    # ── SPA fallback ──────────────────────────────────────────────────
    # Expo Router generates per-route HTML files (index.html, friends.html, etc.).
    # Try exact file first, then directory index, then SPA fallback.
    location / {
        try_files \$uri \$uri/ \$uri.html /index.html;
    }
}
EOF
}

deploy_frontend() {
    log_info "Deploying frontend to $FRONTEND_HOST..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would sync dist/ to $SSH_USER@$FRONTEND_SSH_HOST:$FRONTEND_PATH"
        return
    fi

    # Create the target directory if it doesn't exist
    run_ssh "$FRONTEND_SSH_HOST" "mkdir -p $FRONTEND_PATH"

    # Sync the dist folder (exclude subdirectories managed separately, e.g. /download)
    rsync -avz --delete --exclude='/download' -e "$RSYNC_SSH" "$PROJECT_ROOT/dist/" "$SSH_USER@$FRONTEND_SSH_HOST:$FRONTEND_PATH/"

    # Generate and deploy nginx config for WASM MIME types + SPA routing
    log_info "Deploying nginx configuration (WASM support + SPA routing)..."
    local nginx_tmp
    nginx_tmp=$(mktemp)
    generate_nginx_config "$nginx_tmp"

    # Upload the config file
    eval "$SCP_CMD '$nginx_tmp' $SSH_USER@$FRONTEND_SSH_HOST:/etc/nginx/sites-available/$FRONTEND_HOST"
    rm -f "$nginx_tmp"

    # Enable site, validate config, and reload nginx
    run_ssh "$FRONTEND_SSH_HOST" "'ln -sf /etc/nginx/sites-available/$FRONTEND_HOST /etc/nginx/sites-enabled/$FRONTEND_HOST && nginx -t && systemctl reload nginx'"

    # Re-apply SSL certificate (certbot modifies the nginx config in-place)
    log_info "Re-applying SSL certificate via certbot..."
    run_ssh "$FRONTEND_SSH_HOST" "'certbot --nginx -d $FRONTEND_HOST --non-interactive --agree-tos --redirect 2>&1 || true'"

    log_success "Frontend deployed to https://$FRONTEND_HOST"
}

deploy_relay_to_host() {
    local host="$1"
    local ip="$2"
    local path="$3"
    local region="$4"
    local location="$5"
    local password="$6"
    local relay_id="$7"
    local public_url="$8"
    local peers="$9"

    local ssh_target="${ip:-$host}"
    local local_ssh_cmd="$SSH_CMD"
    local local_rsync_ssh="$RSYNC_SSH"

    # Override SSH commands if a specific password is provided
    if [[ -n "$password" ]]; then
        export SSHPASS="$password"
        local_ssh_cmd="sshpass -e ssh -o StrictHostKeyChecking=no"
        local_rsync_ssh="sshpass -e ssh -o StrictHostKeyChecking=no"
    fi

    log_info "Deploying relay to $host ($ssh_target)..."
    log_info "  Region: $region, Location: $location"
    if [[ -n "$peers" ]]; then
        log_info "  Federation ID: $relay_id"
        log_info "  Public URL: $public_url"
        log_info "  Peers: $peers"
    else
        log_info "  Federation: disabled (no peers)"
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would deploy relay to $SSH_USER@$ssh_target:$path"
        return
    fi

    # ── Stage all relay files locally, then rsync once ──────────────
    # Instead of 7+ separate rsync calls (each opening a new SSH
    # connection that can get rate-limited or killed), we assemble
    # everything into a temp directory and do ONE rsync transfer.
    local staging_dir
    staging_dir=$(mktemp -d)
    trap "rm -rf '$staging_dir'" RETURN

    log_info "Staging relay files..."

    # Relay core
    mkdir -p "$staging_dir/src" "$staging_dir/bridge-bot/src"
    cp "$PROJECT_ROOT/packages/umbra-relay/Dockerfile"           "$staging_dir/"
    cp "$PROJECT_ROOT/packages/umbra-relay/docker-compose.yml"   "$staging_dir/"
    cp "$PROJECT_ROOT/packages/umbra-relay/Cargo.toml"           "$staging_dir/"
    cp "$PROJECT_ROOT/packages/umbra-relay/Cargo.lock"           "$staging_dir/"
    cp -R "$PROJECT_ROOT/packages/umbra-relay/src/"              "$staging_dir/src/"

    # .env (OAuth credentials) — optional
    if [[ -f "$PROJECT_ROOT/packages/umbra-relay/.env" ]]; then
        cp "$PROJECT_ROOT/packages/umbra-relay/.env" "$staging_dir/"
        log_info "OAuth credentials (.env) included"
    fi

    # Bridge bot
    cp "$PROJECT_ROOT/packages/umbra-bridge-bot/package.json"     "$staging_dir/bridge-bot/"
    cp "$PROJECT_ROOT/packages/umbra-bridge-bot/package-lock.json" "$staging_dir/bridge-bot/" 2>/dev/null || true
    cp "$PROJECT_ROOT/packages/umbra-bridge-bot/tsconfig.json"    "$staging_dir/bridge-bot/"
    cp "$PROJECT_ROOT/packages/umbra-bridge-bot/Dockerfile"       "$staging_dir/bridge-bot/"
    cp -R "$PROJECT_ROOT/packages/umbra-bridge-bot/src/"          "$staging_dir/bridge-bot/src/"

    # ── Single rsync transfer ──────────────────────────────────────
    log_info "Uploading relay files (single transfer)..."
    eval "$local_ssh_cmd -o ServerAliveInterval=30 -o ServerAliveCountMax=5 $SSH_USER@$ssh_target 'mkdir -p $path'"
    rsync -avz --delete \
        -e "$local_rsync_ssh -o ServerAliveInterval=30 -o ServerAliveCountMax=5" \
        "$staging_dir/" "$SSH_USER@$ssh_target:$path/"

    # ── Build and restart on the server ────────────────────────────
    log_info "Building and starting relay on server..."
    eval "$local_ssh_cmd -o ServerAliveInterval=30 -o ServerAliveCountMax=5 $SSH_USER@$ssh_target 'cd $path && \
        RELAY_REGION=\"$region\" \
        RELAY_LOCATION=\"$location\" \
        RELAY_ID=\"$relay_id\" \
        RELAY_PUBLIC_URL=\"$public_url\" \
        RELAY_PEERS=\"$peers\" \
        docker compose build && \
        docker compose down || true && \
        RELAY_REGION=\"$region\" \
        RELAY_LOCATION=\"$location\" \
        RELAY_ID=\"$relay_id\" \
        RELAY_PUBLIC_URL=\"$public_url\" \
        RELAY_PEERS=\"$peers\" \
        docker compose up -d'"

    # Start bridge bot if DISCORD_BOT_TOKEN is configured in .env
    eval "$local_ssh_cmd -o ServerAliveInterval=30 -o ServerAliveCountMax=5 $SSH_USER@$ssh_target 'cd $path && \
        if grep -q \"^DISCORD_BOT_TOKEN=.\" .env 2>/dev/null; then \
            echo \"Starting bridge bot...\"; \
            docker compose --profile bridge build && \
            docker compose --profile bridge up -d; \
        else \
            echo \"DISCORD_BOT_TOKEN not set in .env, skipping bridge bot\"; \
        fi'"

    # Show status
    eval "$local_ssh_cmd -o ServerAliveInterval=30 -o ServerAliveCountMax=5 $SSH_USER@$ssh_target 'cd $path && \
        docker compose ps && \
        docker compose logs --tail=20'"

    log_success "Relay deployed to wss://$host"
}

deploy_relay() {
    # Deploy primary relay (US East) — federated with Seoul
    deploy_relay_to_host \
        "$RELAY_HOST" \
        "$RELAY_SSH_HOST" \
        "$RELAY_PATH" \
        "${RELAY_REGION:-US East}" \
        "${RELAY_LOCATION:-New York}" \
        "" \
        "relay-us-east-1" \
        "wss://${RELAY_HOST}/ws" \
        "wss://${RELAY_SEOUL_HOST:-seoul.relay.umbra.chat}/ws"
}

deploy_relay_seoul() {
    # Deploy Seoul relay — federated with US East
    if [[ -z "$RELAY_SEOUL_HOST" ]]; then
        log_warn "Seoul relay not configured (RELAY_SEOUL_HOST not set)"
        return
    fi
    deploy_relay_to_host \
        "$RELAY_SEOUL_HOST" \
        "$RELAY_SEOUL_IP" \
        "$RELAY_SEOUL_PATH" \
        "${RELAY_SEOUL_REGION:-Asia Pacific}" \
        "${RELAY_SEOUL_LOCATION:-Seoul}" \
        "$RELAY_SEOUL_PASSWORD" \
        "relay-ap-seoul-1" \
        "wss://${RELAY_SEOUL_HOST}/ws" \
        "wss://${RELAY_HOST:-relay.umbra.chat}/ws"
}

deploy_all_relays() {
    deploy_relay
    deploy_relay_seoul
}

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------

main() {
    local command="all"
    SKIP_BUILD="false"
    DRY_RUN="false"

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            frontend|relay|relay-seoul|relays|all)
                command="$1"
                shift
                ;;
            --skip-build)
                SKIP_BUILD="true"
                shift
                ;;
            --dry-run)
                DRY_RUN="true"
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    echo ""
    echo "=============================================="
    echo "  Umbra Deployment"
    echo "=============================================="
    echo ""

    # Load credentials
    load_credentials

    if [[ "$DRY_RUN" == "true" ]]; then
        log_warn "DRY RUN MODE - No changes will be made"
        echo ""
    fi

    # Execute based on command
    case $command in
        frontend)
            if [[ "$SKIP_BUILD" != "true" ]]; then
                build_frontend
            else
                log_info "Skipping frontend build (--skip-build)"
            fi
            deploy_frontend
            ;;
        relay)
            deploy_relay
            ;;
        relay-seoul)
            deploy_relay_seoul
            ;;
        relays)
            deploy_all_relays
            ;;
        all)
            if [[ "$SKIP_BUILD" != "true" ]]; then
                build_frontend
            else
                log_info "Skipping frontend build (--skip-build)"
            fi
            deploy_frontend
            deploy_all_relays
            ;;
    esac

    echo ""
    echo "=============================================="
    log_success "Deployment complete!"
    echo "=============================================="
    echo ""
    echo "  Frontend:     https://$FRONTEND_HOST"
    echo "  Relay (US):   wss://$RELAY_HOST"
    if [[ -n "$RELAY_SEOUL_HOST" ]]; then
        echo "  Relay (Seoul): wss://$RELAY_SEOUL_HOST"
    fi
    echo ""
}

main "$@"
