#!/usr/bin/env bash
# 构建并打包 WindowOFHonor 全部 Docker 镜像为离线部署包
# 用法: bash scripts/package-images.sh [版本号，默认 1.0.0]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="${1:-1.0.0}"
RELEASE_NAME="windowofhonor-${VERSION}"
OUT_DIR="${ROOT}/dist/${RELEASE_NAME}"
IMAGES_TAR="${OUT_DIR}/images/windowofhonor-images.tar.gz"

APP_IMAGES=(
  "windowofhonor-api:${VERSION}"
  "windowofhonor-web:${VERSION}"
  "windowofhonor-mcp:${VERSION}"
)
BASE_IMAGES=(
  "postgres:16-alpine"
  "redis:7-alpine"
  "nginx:1.27-alpine"
)

echo "==> WindowOFHonor 镜像打包 v${VERSION}"
echo "    输出目录: ${OUT_DIR}"

# 基础镜像（优先国内镜像源）
if ! docker image inspect postgres:16-alpine &>/dev/null; then
  echo "==> 拉取基础镜像..."
  if [[ -f "${ROOT}/scripts/pull-images.sh" ]]; then
    bash "${ROOT}/scripts/pull-images.sh" 1panel || bash "${ROOT}/scripts/pull-images.sh" 1ms || true
  fi
  for img in "${BASE_IMAGES[@]}"; do
    if ! docker image inspect "$img" &>/dev/null; then
      echo ">>> docker pull $img"
      docker pull "$img" || { echo "❌ 无法拉取 $img，请先配置镜像源或手动 docker pull"; exit 1; }
    fi
  done
fi

# 构建应用镜像
echo "==> 构建应用镜像..."
docker build -t "windowofhonor-api:${VERSION}" "${ROOT}/apps/api"
docker build -t "windowofhonor-web:${VERSION}" "${ROOT}/apps/web"
docker build -t "windowofhonor-mcp:${VERSION}" "${ROOT}/apps/mcp"

# 组装发布目录
rm -rf "${OUT_DIR}"
mkdir -p "${OUT_DIR}/images" "${OUT_DIR}/docker/nginx"

echo "==> 导出镜像到 ${IMAGES_TAR} ..."
docker save "${APP_IMAGES[@]}" "${BASE_IMAGES[@]}" | gzip > "${IMAGES_TAR}"

cp "${ROOT}/docker-compose.prod.yml" "${OUT_DIR}/docker-compose.yml"
cp "${ROOT}/.env.example" "${OUT_DIR}/.env.example"
cp "${ROOT}/docker/nginx/nginx.conf" "${OUT_DIR}/docker/nginx/nginx.conf"
cp "${ROOT}/scripts/deploy-linux.sh" "${OUT_DIR}/deploy-linux.sh"
cp "${ROOT}/scripts/deploy-macos.sh" "${OUT_DIR}/deploy-macos.sh"
cp "${ROOT}/scripts/deploy-windows.ps1" "${OUT_DIR}/deploy-windows.ps1"
cp "${ROOT}/scripts/deploy-windows.bat" "${OUT_DIR}/deploy-windows.bat"
chmod +x "${OUT_DIR}/deploy-linux.sh" "${OUT_DIR}/deploy-macos.sh"

# 写入版本信息
cat > "${OUT_DIR}/VERSION" <<EOF
WindowOFHonor ${VERSION}
Packaged: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
Platform: $(uname -s)/$(uname -m)
Images:
$(printf '  - %s\n' "${APP_IMAGES[@]}" "${BASE_IMAGES[@]}")
EOF

ARCHIVE="${ROOT}/dist/${RELEASE_NAME}.tar.gz"
echo "==> 压缩发布包..."
tar -czf "${ARCHIVE}" -C "${ROOT}/dist" "${RELEASE_NAME}"

SIZE=$(du -h "${ARCHIVE}" | cut -f1)
echo ""
echo "✅ 打包完成"
echo "   目录: ${OUT_DIR}"
echo "   镜像: ${IMAGES_TAR} ($(du -h "${IMAGES_TAR}" | cut -f1))"
echo "   压缩包: ${ARCHIVE} (${SIZE})"
echo ""
echo "部署方式:"
echo "  Linux:   tar -xzf ${RELEASE_NAME}.tar.gz && cd ${RELEASE_NAME} && ./deploy-linux.sh"
echo "  macOS:   tar -xzf ${RELEASE_NAME}.tar.gz && cd ${RELEASE_NAME} && ./deploy-macos.sh"
echo "  Windows: 解压 ${RELEASE_NAME}.tar.gz 后双击 deploy-windows.bat"
