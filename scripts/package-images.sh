#!/usr/bin/env bash
# 将本机已有 / 现构建的 WindowOFHonor 镜像打包为离线部署目录
# 用法:
#   bash scripts/package-images.sh [版本号]              # 默认构建缺失镜像后打包
#   bash scripts/package-images.sh 1.0.0 --export-only  # 仅导出本地已有镜像（不构建）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="1.0.0"
EXPORT_ONLY=0

for arg in "$@"; do
  case "$arg" in
    --export-only|--skip-build) EXPORT_ONLY=1 ;;
    -*)
      echo "未知参数: $arg"
      echo "用法: $0 [版本号] [--export-only]"
      exit 1
      ;;
    *) VERSION="$arg" ;;
  esac
done

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
echo "    主机架构: $(uname -m)"
[[ "$EXPORT_ONLY" -eq 1 ]] && echo "    模式: 仅导出本地镜像（不构建）"

need_base=0
for img in "${BASE_IMAGES[@]}"; do
  docker image inspect "$img" &>/dev/null || need_base=1
done

if [[ "$need_base" -eq 1 ]]; then
  if [[ "$EXPORT_ONLY" -eq 1 ]]; then
    echo "❌ 缺少基础镜像，请先拉取或取消 --export-only"
    for img in "${BASE_IMAGES[@]}"; do
      docker image inspect "$img" &>/dev/null || echo "   缺失: $img"
    done
    exit 1
  fi
  echo "==> 拉取基础镜像..."
  if [[ -f "${ROOT}/scripts/pull-images.sh" ]]; then
    bash "${ROOT}/scripts/pull-images.sh" 1ms || bash "${ROOT}/scripts/pull-images.sh" 1panel || true
  fi
  for img in "${BASE_IMAGES[@]}"; do
    if ! docker image inspect "$img" &>/dev/null; then
      echo ">>> docker pull --platform linux/$(uname -m | sed 's/x86_64/amd64/') $img"
      docker pull --platform "linux/$(uname -m | sed 's/x86_64/amd64/;s/arm64/arm64/')" "$img" \
        || docker pull "$img" \
        || { echo "❌ 无法拉取 $img"; exit 1; }
    fi
  done
fi

if [[ "$EXPORT_ONLY" -eq 1 ]]; then
  for img in "${APP_IMAGES[@]}"; do
    docker image inspect "$img" &>/dev/null || {
      echo "❌ 缺少应用镜像 $img，请先构建或去掉 --export-only"
      exit 1
    }
  done
  echo "==> 使用本地已有应用镜像"
else
  echo "==> 构建应用镜像..."
  PLATFORM="linux/$(uname -m | sed 's/x86_64/amd64/')"
  docker build --platform "$PLATFORM" --pull=false -t "windowofhonor-api:${VERSION}" "${ROOT}/apps/api"
  docker build --platform "$PLATFORM" --pull=false -t "windowofhonor-web:${VERSION}" "${ROOT}/apps/web"
  docker build --platform "$PLATFORM" --pull=false -t "windowofhonor-mcp:${VERSION}" "${ROOT}/apps/mcp"
fi

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
cp "${ROOT}/scripts/deploy-offline.sh" "${OUT_DIR}/deploy-offline.sh"
chmod +x "${OUT_DIR}/deploy-linux.sh" "${OUT_DIR}/deploy-macos.sh" "${OUT_DIR}/deploy-offline.sh"

ARCH="$(uname -m)"
cat > "${OUT_DIR}/VERSION" <<EOF
WindowOFHonor ${VERSION}
Packaged: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
Platform: $(uname -s)/${ARCH}
Images:
$(printf '  - %s\n' "${APP_IMAGES[@]}" "${BASE_IMAGES[@]}")
EOF

cat > "${OUT_DIR}/README.md" <<EOF
# 荣耀之窗 WindowOFHonor 离线部署包

版本: ${VERSION}
打包架构: ${ARCH}

## 一键部署

| 平台 | 命令 |
|------|------|
| macOS / Linux（推荐） | \`./deploy-offline.sh\` |
| macOS | \`./deploy-macos.sh\` |
| Linux | \`./deploy-linux.sh\` |
| Windows | \`deploy-windows.bat\` |

首次运行会从 \`images/windowofhonor-images.tar.gz\` 加载镜像，读取或生成 \`.env\`，启动全部服务并初始化系统管理员。

## 访问

- Web: http://localhost:8080
- API: http://localhost:8080/api/health
- MCP: http://localhost:3100/mcp

默认管理员用户名见 \`.env\` 的 \`SEED_SUPERADMIN_USERNAME\`（默认 \`superadmin\`），密码为 \`SEED_SUPERADMIN_PASSWORD\`。

## 注意

- 本包镜像架构为 **${ARCH}**，请在相同 CPU 架构机器上部署。
- 需已安装 Docker（macOS 用 Docker Desktop）。
- 部署时默认 \`--pull never\`，完全使用包内镜像，不访问外网。
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
echo "离线部署:"
echo "  cd ${OUT_DIR} && ./deploy-offline.sh"
echo "  或: tar -xzf ${ARCHIVE} && cd ${RELEASE_NAME} && ./deploy-offline.sh"
