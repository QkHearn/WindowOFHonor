# WindowOFHonor Windows 一键部署（需 Docker Desktop）
# 用法: 在发布包目录内右键「使用 PowerShell 运行」，或执行:
#   powershell -ExecutionPolicy Bypass -File .\deploy-windows.ps1
$ErrorActionPreference = "Stop"

$Dir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Dir

$ComposeFile = "docker-compose.yml"
$ImagesTarGz = Join-Path $Dir "images\windowofhonor-images.tar.gz"
$EnvFile = ".env"
$SeedFlag = ".seeded"

function Log($msg) { Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $msg" }
function Die($msg) { Write-Host "❌ $msg" -ForegroundColor Red; exit 1 }

# ── 环境检查 ──────────────────────────────────────
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Die "未安装 Docker，请先安装 Docker Desktop: https://www.docker.com/products/docker-desktop/"
}

try {
    docker compose version | Out-Null
} catch {
    Die "未找到 docker compose v2，请更新 Docker Desktop"
}

try {
    docker info 2>&1 | Out-Null
} catch {
    Die "Docker 未运行，请先启动 Docker Desktop"
}

# ── 配置文件 ──────────────────────────────────────
if (-not (Test-Path $EnvFile)) {
    Log "创建 .env（请稍后修改密码与密钥）"
    Copy-Item ".env.example" $EnvFile
    Log "⚠️  已生成 .env，生产环境请务必修改 POSTGRES_PASSWORD、JWT_SECRET、MCP_* 等"
}

# ── 加载镜像 ──────────────────────────────────────
if (Test-Path $ImagesTarGz) {
    Log "加载离线镜像包（约 1-3 分钟）..."
    $tempTar = Join-Path $env:TEMP "windowofhonor-images-$([guid]::NewGuid().ToString('n')).tar"
    try {
        $inStream = [System.IO.File]::OpenRead($ImagesTarGz)
        $gzip = New-Object System.IO.Compression.GzipStream(
            $inStream,
            [System.IO.Compression.CompressionMode]::Decompress
        )
        $outStream = [System.IO.File]::Create($tempTar)
        $gzip.CopyTo($outStream)
        $outStream.Close()
        $gzip.Close()
        $inStream.Close()

        docker load -i $tempTar
    } finally {
        if (Test-Path $tempTar) { Remove-Item $tempTar -Force }
    }
} else {
    Log "未找到 images\windowofhonor-images.tar.gz，将使用本地已有镜像"
}

$requiredImages = @(
    "windowofhonor-api:1.0.0",
    "windowofhonor-web:1.0.0",
    "windowofhonor-mcp:1.0.0"
)
foreach ($img in $requiredImages) {
    docker image inspect $img 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Die "缺少镜像 $img，请先在有网环境运行 package-images.sh 打包，或将镜像 tar 放到 images 目录"
    }
}

# ── 启动服务 ──────────────────────────────────────
Log "启动服务..."
docker compose -f $ComposeFile --env-file $EnvFile up -d
if ($LASTEXITCODE -ne 0) { Die "docker compose up 失败" }

Log "等待 API 健康检查..."
$healthy = $false
for ($i = 1; $i -le 40; $i++) {
    docker compose -f $ComposeFile exec -T api wget -qO- http://localhost:3000/api/health 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $healthy = $true
        break
    }
    Start-Sleep -Seconds 2
}
if (-not $healthy) {
    Die "API 启动超时，请检查: docker compose logs api"
}

# ── 初始化系统管理员（仅首次）──────────────────────
if (-not (Test-Path $SeedFlag)) {
    Log "初始化系统管理员（读取 .env 中的 SEED_SUPERADMIN_*）..."
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^\s*([^#=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Item -Path "env:$name" -Value $value
        }
    }
    $seedUser = if ($env:SEED_SUPERADMIN_USERNAME) { $env:SEED_SUPERADMIN_USERNAME } else { "superadmin" }
    $seedPass = $env:SEED_SUPERADMIN_PASSWORD
    $seedName = if ($env:SEED_SUPERADMIN_DISPLAY_NAME) { $env:SEED_SUPERADMIN_DISPLAY_NAME } else { "系统管理员" }
    if (-not $seedPass) {
        Die "请在 .env 中设置 SEED_SUPERADMIN_PASSWORD"
    }
    docker compose -f $ComposeFile exec -T `
        -e "SEED_SUPERADMIN_USERNAME=$seedUser" `
        -e "SEED_SUPERADMIN_PASSWORD=$seedPass" `
        -e "SEED_SUPERADMIN_DISPLAY_NAME=$seedName" `
        api npx prisma db seed
    if ($LASTEXITCODE -eq 0) {
        New-Item -ItemType File -Path $SeedFlag -Force | Out-Null
    } else {
        Log "seed 跳过（可能已存在数据）"
    }
}

$port = "8080"
if (Test-Path $EnvFile) {
    $line = Get-Content $EnvFile | Where-Object { $_ -match '^NGINX_PORT=' } | Select-Object -First 1
    if ($line) {
        $port = ($line -split '=', 2)[1].Trim()
    }
}
if (-not $port) { $port = "8080" }

Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  荣耀之窗 WindowOFHonor 部署成功 (Windows)" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Web:  http://localhost:$port"
Write-Host "  API:  http://localhost:$port/api/health"
Write-Host "  MCP:  http://localhost:3100/mcp"
Write-Host ""
$seedUserLine = Get-Content $EnvFile | Where-Object { $_ -match '^SEED_SUPERADMIN_USERNAME=' } | Select-Object -First 1
$seedUser = if ($seedUserLine) { ($seedUserLine -split '=', 2)[1].Trim() } else { "superadmin" }
Write-Host "  系统管理员: $seedUser（密码见 .env 中 SEED_SUPERADMIN_PASSWORD）"
Write-Host ""
Write-Host "  常用命令 (PowerShell / CMD):"
Write-Host "    docker compose logs -f"
Write-Host "    docker compose down"
Write-Host "    docker compose restart"
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan

$open = Read-Host "是否在浏览器中打开 http://localhost:$port ? [y/N]"
if ($open -eq 'y' -or $open -eq 'Y') {
    Start-Process "http://localhost:$port"
}
