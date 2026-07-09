# 荣耀之窗 · WindowOFHonor

企业荣誉激励与展示系统。支持 Docker 一键部署与 MCP 大模型接口。

## 文档

- [需求设计书](docs/需求设计书.md)
- [技术架构选型](docs/技术架构选型.md)
- [UI 奢侈品风格提示词](docs/UI奢侈品风格提示词.md)
- [MCP Cursor 配置示例](docs/mcp-cursor-config.example.json)

## 技术栈

| 组件 | 技术 |
|------|------|
| 前端 | React 19 + Vite + Tailwind |
| API | NestJS + Prisma + PostgreSQL |
| MCP | @modelcontextprotocol/sdk (Streamable HTTP) |
| 部署 | Docker Compose + Nginx |

## 快速启动（Docker）

```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env，修改密码与密钥

# 2. 构建并启动
docker compose up -d --build

# 3. 初始化演示数据（首次）
docker compose exec api npx ts-node prisma/seed.ts

# 4. 访问
# Web:    http://localhost:8080
# API:    http://localhost:8080/api/health
# MCP:    http://localhost:3100/mcp  (或经网关 http://localhost:8080/mcp)
```

### 演示账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 主管 | admin | admin123 |
| 员工 | zhangsan / lisi / wangwu | 123456 |

## 镜像构建

```bash
docker build -t windowofhonor-api:1.0.0 ./apps/api
docker build -t windowofhonor-web:1.0.0 ./apps/web
docker build -t windowofhonor-mcp:1.0.0 ./apps/mcp
```

### 离线部署包

```bash
bash scripts/package-images.sh 1.0.0
# 生成 dist/windowofhonor-1.0.0.tar.gz
```

| 平台 | 部署方式 |
|------|----------|
| Linux | 解压后 `./deploy-linux.sh` |
| macOS | 解压后 `./deploy-macos.sh` |
| Windows | 解压后双击 `deploy-windows.bat` 或 `powershell -ExecutionPolicy Bypass -File deploy-windows.ps1` |

## MCP 工具列表

| 工具 | 说明 |
|------|------|
| `honor_issue_incentive` | 发放激励 |
| `honor_get_broadcast` | 荣誉展播 |
| `honor_get_leaderboard` | 个人/团队排行榜 |
| `honor_get_user_honors` | 用户荣誉 |
| `honor_get_partners` | 最佳拍档与关系网络 |
| `honor_get_tasks` | 任务令 |
| `honor_like_user` | 点赞 |
| `honor_search_users` | 搜索员工 |
| `command_query_all_honors` | 【外部查询】全部荣誉 |
| `command_query_all_tasks` | 【外部查询】全部任务令 |
| `command_query_latest_honor` | 【外部查询】最新荣誉 |
| `command_query_latest_task` | 【外部查询】最新任务令 |
| `command_query_today` | 【外部查询】今日新增荣誉与任务令 |

外部查询 API（需 `X-Service-Token`）：`GET /api/queries/honors`、`/tasks`、`/honors/latest`、`/tasks/latest`、`/today`

### Cursor 接入

将 `docs/mcp-cursor-config.example.json` 中的配置合并到 Cursor MCP 设置，并替换 `MCP_API_KEY`。

### stdio 模式（本地开发）

```bash
cd apps/mcp
MCP_TRANSPORT=stdio MCP_SERVICE_TOKEN=xxx API_BASE_URL=http://localhost:3000 npm run start:stdio
```

## 本地开发

```bash
# 仅启动数据库
docker compose up -d postgres redis

# 安装依赖
cd apps/api && npm install && npx prisma migrate dev && npm run dev
cd apps/web && npm install && npm run dev
cd apps/mcp && npm install && npm run dev
```

## 服务架构

```
浏览器 → Nginx(:8080) → web / api / mcp
大模型  → MCP(:3100/mcp) → API(内网) → PostgreSQL
```

## 测试

详见 [docs/测试说明.md](docs/测试说明.md)。

```bash
# 全部测试（含测试数据库）
npm test

# 部署后系统冒烟
docker compose up -d --build
docker compose exec api npx prisma db seed
npm run test:smoke
```

| 命令 | 说明 |
|------|------|
| `cd apps/api && npm run test:unit` | API 单元测试（10 项） |
| `cd apps/api && npm run test:e2e` | API 集成测试（需 PostgreSQL） |
| `cd apps/mcp && npm test` | MCP Client 测试 |
| `cd apps/web && npm test` | 前端组件测试 |

## License

Private / Internal Use
