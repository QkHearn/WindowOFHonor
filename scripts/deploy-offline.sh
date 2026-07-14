#!/usr/bin/env bash
# WindowOFHonor 离线一键部署（macOS / Linux）
# 在发布包目录内执行: ./deploy-offline.sh
# 优先加载 images/windowofhonor-images.tar.gz，绝不从外网拉镜像
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

COMPOSE_FILE="docker-compose.yml"
IMAGES_TAR="images/windowofhonor-images.tar.gz"
ENV_FILE=".env"
SEED_FLAG=".seeded"

# 与镜像 tag 保持一致（打包时 VERSION 文件可覆盖）
APP_VERSION="1.0.0"
if [[ -f VERSION ]]; then
  APP_VERSION="$(grep -E '^WindowOFHonor ' VERSION | awk '{print $2}' || echo "$APP_VERSION")"
fi

log() { echo "[$(date '+%H:%M:%S')] $*"; }
die() { echo "❌ $*" >&2; exit 1; }

command -v docker >/dev/null 2>&1 || die "未找到 docker，请先安装 Docker Desktop / Docker Engine"
docker compose version >/dev/null 2>&1 || die "未找到 docker compose，请安装 Compose V2"
docker info >/dev/null 2>&1 || die "Docker 未运行，请先启动 Docker"

[[ -f "$COMPOSE_FILE" ]] || die "缺少 ${COMPOSE_FILE}"
[[ -f .env.example ]] || die "缺少 .env.example"

if [[ ! -f "$ENV_FILE" ]]; then
  log "创建 .env（请修改密码与密钥）"
  cp .env.example "$ENV_FILE"
fi

if [[ -f "$IMAGES_TAR" ]]; then
  log "加载离线镜像包 ${IMAGES_TAR}（可能需要 1–3 分钟）..."
  gunzip -c "$IMAGES_TAR" | docker load
else
  log "未找到 ${IMAGES_TAR}，将尝试使用本机已有镜像"
fi

for img in \
  "windowofhonor-api:${APP_VERSION}" \
  "windowofhonor-web:${APP_VERSION}" \
  "windowofhonor-mcp:${APP_VERSION}" \
  "postgres:16-alpine" \
  "redis:7-alpine" \
  "nginx:1.27-alpine"
do
  docker image inspect "$img" >/dev/null 2>&1 || die "缺少镜像 $img"
done

log "启动服务（--pull never，不访问外网）..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --pull never

log "等待 API 健康检查..."
for i in $(seq 1 40); do
  if docker compose -f "$COMPOSE_FILE" exec -T api wget -qO- http://localhost:3000/api/health >/dev/null 2>&1; then
    break
  fi
  sleep 2
  [[ $i -eq 40 ]] && die "API 启动超时，请检查: docker compose logs api"
done

if [[ ! -f "$SEED_FLAG" ]]; then
  log "初始化系统管理员..."
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  docker compose -f "$COMPOSE_FILE" exec -T \
    -e SEED_SUPERADMIN_USERNAME="${SEED_SUPERADMIN_USERNAME:-superadmin}" \
    -e SEED_SUPERADMIN_PASSWORD="${SEED_SUPERADMIN_PASSWORD:?请在 .env 中设置 SEED_SUPERADMIN_PASSWORD}" \
    -e SEED_SUPERADMIN_DISPLAY_NAME="${SEED_SUPERADMIN_DISPLAY_NAME:-系统管理员}" \
    api npx prisma db seed && touch "$SEED_FLAG" || log "seed 跳过（可能已有数据）"
fi

PORT="$(grep -E '^NGINX_PORT=' "$ENV_FILE" 2>/dev/null | cut -d= -f2- || true)"
PORT="${PORT:-8080}"
USER_NAME="$(grep -E '^SEED_SUPERADMIN_USERNAME=' "$ENV_FILE" 2>/dev/null | cut -d= -f2- || true)"
USER_NAME="${USER_NAME:-superadmin}"

echo ""
echo "════════════════════════════════════════"
echo "  荣耀之窗 离线部署成功"
echo "════════════════════════════════════════"
echo "  Web:  http://localhost:${PORT}"
echo "  API:  http://localhost:${PORT}/api/health"
echo "  MCP:  http://localhost:3100/mcp"
echo "  账号: ${USER_NAME}（密码见 .env 的 SEED_SUPERADMIN_PASSWORD）"
echo ""
echo "  常用:"
echo "    docker compose logs -f"
echo "    docker compose down"
echo "════════════════════════════════════════"
