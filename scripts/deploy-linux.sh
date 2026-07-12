#!/usr/bin/env bash
# WindowOFHonor Linux 一键部署（需 Docker Engine + Compose V2）
# 在发布包目录内执行: ./deploy-linux.sh
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
command -v docker >/dev/null 2>&1 || die "未安装 Docker，请先安装: https://docs.docker.com/engine/install/"
docker compose version >/dev/null 2>&1 || die "未找到 docker compose v2，请安装 Docker Compose 插件"

if ! docker info >/dev/null 2>&1; then
  die "Docker 守护进程未运行，请执行: sudo systemctl start docker"
fi

# ── 配置文件 ──────────────────────────────────────
if [[ ! -f "$ENV_FILE" ]]; then
  log "创建 .env（请稍后修改密码与密钥）"
  cp .env.example "$ENV_FILE"
  log "⚠️  已生成 .env，生产环境请务必修改 POSTGRES_PASSWORD、JWT_SECRET、MCP_* 等"
fi

# ── 加载镜像 ──────────────────────────────────────
if [[ -f "$IMAGES_TAR" ]]; then
  log "加载离线镜像包..."
  gunzip -c "$IMAGES_TAR" | docker load
else
  log "未找到 ${IMAGES_TAR}，将使用本地已有镜像"
fi

for img in windowofhonor-api:1.0.0 windowofhonor-web:1.0.0 windowofhonor-mcp:1.0.0; do
  docker image inspect "$img" >/dev/null 2>&1 || die "缺少镜像 $img，请先运行 package-images.sh 打包或手动构建"
done

# ── 启动服务 ──────────────────────────────────────
log "启动服务..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

log "等待 API 健康检查..."
for i in $(seq 1 30); do
  if docker compose -f "$COMPOSE_FILE" exec -T api wget -qO- http://localhost:3000/api/health >/dev/null 2>&1; then
    break
  fi
  sleep 2
  [[ $i -eq 30 ]] && die "API 启动超时，请检查: docker compose logs api"
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

echo ""
echo "════════════════════════════════════════"
echo "  荣耀之窗 WindowOFHonor 部署成功 (Linux)"
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
