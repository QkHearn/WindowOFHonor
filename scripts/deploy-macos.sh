#!/usr/bin/env bash
# WindowOFHonor macOS 一键部署（需 Docker Desktop）
# 在发布包目录内执行: ./deploy-macos.sh
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

COMPOSE_FILE="docker-compose.yml"
IMAGES_TAR="images/windowofhonor-images.tar.gz"
ENV_FILE=".env"
SEED_FLAG=".seeded"

log() { echo "[$(date '+%H:%M:%S')] $*"; }
die() { echo "❌ $*" >&2; exit 1; }

# ── 环境检查 ──────────────────────────────────────
[[ "$(uname -s)" == "Darwin" ]] || log "提示: 此脚本面向 macOS，当前系统为 $(uname -s)"

if [[ ! -d "/Applications/Docker.app" ]] && ! command -v docker >/dev/null 2>&1; then
  die "未检测到 Docker Desktop，请安装: https://www.docker.com/products/docker-desktop/"
fi

command -v docker >/dev/null 2>&1 || die "未找到 docker 命令"
docker compose version >/dev/null 2>&1 || die "未找到 docker compose，请更新 Docker Desktop"

if ! docker info >/dev/null 2>&1; then
  die "Docker Desktop 未运行，请打开 Docker Desktop 后重试"
fi

# Apple Silicon 提示
if [[ "$(uname -m)" == "arm64" ]]; then
  log "检测到 Apple Silicon (arm64)，使用本机架构镜像"
fi

# ── 配置文件 ──────────────────────────────────────
if [[ ! -f "$ENV_FILE" ]]; then
  log "创建 .env（请稍后修改密码与密钥）"
  cp .env.example "$ENV_FILE"
  log "⚠️  已生成 .env，生产环境请务必修改 POSTGRES_PASSWORD、JWT_SECRET、MCP_* 等"
fi

# ── 加载镜像 ──────────────────────────────────────
if [[ -f "$IMAGES_TAR" ]]; then
  log "加载离线镜像包（可能需要 1-3 分钟）..."
  gunzip -c "$IMAGES_TAR" | docker load
else
  log "未找到 ${IMAGES_TAR}，将使用本地已有镜像"
fi

for img in windowofhonor-api:1.0.0 windowofhonor-web:1.0.0 windowofhonor-mcp:1.0.0; do
  docker image inspect "$img" >/dev/null 2>&1 || die "缺少镜像 $img，请先在本机运行 bash scripts/package-images.sh 打包"
done

# ── 启动服务 ──────────────────────────────────────
log "启动服务..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --pull never

log "等待 API 健康检查..."
for i in $(seq 1 40); do
  if docker compose -f "$COMPOSE_FILE" exec -T api wget -qO- http://localhost:3000/api/health >/dev/null 2>&1; then
    break
  fi
  sleep 2
  [[ $i -eq 40 ]] && die "API 启动超时，请检查: docker compose logs api"
done

# ── 初始化系统管理员（仅首次）──────────────────────
if [[ ! -f "$SEED_FLAG" ]]; then
  log "初始化系统管理员（读取 .env 中的 SEED_SUPERADMIN_*）..."
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  docker compose -f "$COMPOSE_FILE" exec -T \
    -e SEED_SUPERADMIN_USERNAME="${SEED_SUPERADMIN_USERNAME:-superadmin}" \
    -e SEED_SUPERADMIN_PASSWORD="${SEED_SUPERADMIN_PASSWORD:?请在 .env 中设置 SEED_SUPERADMIN_PASSWORD}" \
    -e SEED_SUPERADMIN_DISPLAY_NAME="${SEED_SUPERADMIN_DISPLAY_NAME:-系统管理员}" \
    api npx prisma db seed && touch "$SEED_FLAG" || log "seed 跳过（可能已存在数据）"
fi

PORT=$(grep -E '^NGINX_PORT=' "$ENV_FILE" 2>/dev/null | cut -d= -f2 || echo "8080")
PORT="${PORT:-8080}"

# macOS 打开浏览器（可选）
if command -v open >/dev/null 2>&1; then
  read -r -p "是否在浏览器中打开 http://localhost:${PORT} ? [y/N] " ans
  [[ "${ans,,}" == "y" ]] && open "http://localhost:${PORT}"
fi

echo ""
echo "════════════════════════════════════════"
echo "  荣耀之窗 WindowOFHonor 部署成功 (macOS)"
echo "════════════════════════════════════════"
echo "  Web:  http://localhost:${PORT}"
echo "  API:  http://localhost:${PORT}/api/health"
echo "  MCP:  http://localhost:3100/mcp"
echo ""
echo "  系统管理员: $(grep -E '^SEED_SUPERADMIN_USERNAME=' "$ENV_FILE" 2>/dev/null | cut -d= -f2- || echo superadmin)（密码见 .env 中 SEED_SUPERADMIN_PASSWORD）"
echo ""
echo "  常用命令:"
echo "    docker compose logs -f"
echo "    docker compose down"
echo "    docker compose restart"
echo "════════════════════════════════════════"
