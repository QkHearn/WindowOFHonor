#!/usr/bin/env bash
# 从国内镜像源拉取 docker-compose 所需基础镜像并打 tag
# 支持: 1panel / 1ms 镜像，用法: bash scripts/pull-images.sh [1panel|1ms]

set -euo pipefail
MIRROR="${1:-1panel}"

case "$MIRROR" in
  1panel) PREFIX="docker.1panel.live/library" ;;
  1ms)    PREFIX="docker.1ms.run/library" ;;
  *)      echo "用法: $0 [1panel|1ms]"; exit 1 ;;
esac

pull_tag() {
  local name="$1" tag="$2"
  echo ">>> pull ${PREFIX}/${name}:${tag}"
  docker pull "${PREFIX}/${name}:${tag}"
  docker tag "${PREFIX}/${name}:${tag}" "${name}:${tag}"
  echo ">>> tagged ${name}:${tag}"
}

pull_tag postgres 16-alpine
pull_tag redis 7-alpine
pull_tag nginx 1.27-alpine
pull_tag node 22-alpine

echo ""
echo "✅ 基础镜像已就绪:"
docker images | grep -E 'postgres|redis|nginx|node' | grep -v 1panel | grep -v 1ms
