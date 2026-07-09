import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'node:crypto';
import express from 'express';
import { z } from 'zod';
import { HonorApiClient } from './api-client.js';

function createServer(): McpServer {
  const server = new McpServer({
    name: 'window-of-honor',
    version: '1.0.0',
  });

  const serviceToken = process.env.MCP_SERVICE_TOKEN ?? '';
  const defaultUserId = process.env.MCP_DEFAULT_USER_ID;

  const client = (userId?: string) =>
    new HonorApiClient(serviceToken, userId ?? defaultUserId);

  server.tool(
    'honor_issue_incentive',
    '主管向一名或多名员工发放激励荣誉',
    {
      title: z.string().describe('激励标题'),
      description: z.string().optional().describe('激励说明'),
      recipientIds: z.array(z.string().uuid()).min(1).describe('接收员工 UUID 列表'),
      honorValue: z.number().int().min(1).optional().describe('荣誉分值，默认 10'),
      actingUserId: z.string().uuid().optional().describe('操作主管用户 ID'),
    },
    async (args) => {
      const api = client(args.actingUserId);
      const result = await api.issueIncentive({
        title: args.title,
        description: args.description,
        recipientIds: args.recipientIds,
        honorValue: args.honorValue,
      });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'honor_get_broadcast',
    '获取荣誉展播最新动态列表',
    {},
    async () => {
      const result = await client().getBroadcast();
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'honor_get_leaderboard',
    '获取激励排行榜（个人版或团队版）',
    {
      type: z.enum(['personal', 'team']).describe('personal=个人版, team=团队版'),
      scope: z.enum(['team', 'company']).optional().describe('个人版范围'),
      period: z.enum(['week', 'month', 'quarter', 'year', 'all']).optional(),
      limit: z.number().int().min(1).max(50).optional(),
    },
    async (args) => {
      const api = client();
      const result =
        args.type === 'team'
          ? await api.getTeamLeaderboard(args.period, args.limit)
          : await api.getPersonalLeaderboard(args.scope, args.period, args.limit);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'honor_get_user_honors',
    '查询指定用户的荣誉摘要与明细',
    { userId: z.string().uuid().describe('用户 UUID') },
    async (args) => {
      const result = await client().getUserHonors(args.userId);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'honor_get_partners',
    '获取用户最佳拍档与共获荣誉关系网络',
    {
      userId: z.string().uuid().describe('用户 UUID'),
      includeNetwork: z.boolean().optional().describe('是否返回关系网络图数据'),
    },
    async (args) => {
      const api = client(args.userId);
      const partners = await api.getPartners(args.userId);
      const network = args.includeNetwork
        ? await api.getCoHonorNetwork(args.userId)
        : undefined;
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ partners, network }, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    'honor_get_tasks',
    '查询用户任务令列表',
    { userId: z.string().uuid().describe('用户 UUID') },
    async (args) => {
      const result = await client(args.userId).getTasks(args.userId);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'honor_like_user',
    '为员工点赞',
    {
      fromUserId: z.string().uuid().describe('点赞人 UUID'),
      toUserId: z.string().uuid().describe('被赞人 UUID'),
      targetType: z.string().describe('目标类型，如 honor_event 或 user_profile'),
      targetId: z.string().uuid().optional(),
    },
    async (args) => {
      const result = await client(args.fromUserId).likeUser(
        {
          toUserId: args.toUserId,
          targetType: args.targetType,
          targetId: args.targetId,
        },
        args.fromUserId,
      );
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'honor_search_users',
    '搜索员工（用于发放激励前查找）',
    { query: z.string().describe('姓名或用户名关键词') },
    async (args) => {
      const result = await client().searchUsers(args.query);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'command_query_all_honors',
    '【外部查询】查询系统中全部荣誉（激励记录），按呈递时间倒序',
    { limit: z.number().int().min(1).max(500).optional().describe('返回条数上限，默认 200') },
    async (args) => {
      const result = await client().queryAllHonors(args.limit);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'command_query_all_tasks',
    '【外部查询】查询系统中全部任务令，按创建时间倒序',
    { limit: z.number().int().min(1).max(500).optional().describe('返回条数上限，默认 200') },
    async (args) => {
      const result = await client().queryAllTasks(args.limit);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'command_query_latest_honor',
    '【外部查询】查询最新一条荣誉（激励记录）',
    {},
    async () => {
      const result = await client().queryLatestHonor();
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'command_query_latest_task',
    '【外部查询】查询最新一条任务令',
    {},
    async () => {
      const result = await client().queryLatestTask();
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'command_query_today',
    '【外部查询】查询今天（上海时区）是否有新增荣誉与任务令，并返回明细及概念说明',
    {},
    async () => {
      const result = await client().queryToday();
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.resource(
    'broadcast-latest',
    'honor://broadcast/latest',
    { mimeType: 'application/json', description: '最新荣誉展播 JSON' },
    async () => {
      const data = await client().getBroadcast();
      return {
        contents: [
          {
            uri: 'honor://broadcast/latest',
            mimeType: 'application/json',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    },
  );

  server.resource(
    'leaderboard-personal',
    'honor://leaderboard/personal',
    { mimeType: 'application/json', description: '个人版排行榜快照' },
    async () => {
      const data = await client().getPersonalLeaderboard();
      return {
        contents: [
          {
            uri: 'honor://leaderboard/personal',
            mimeType: 'application/json',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    },
  );

  server.resource(
    'leaderboard-team',
    'honor://leaderboard/team',
    { mimeType: 'application/json', description: '团队版排行榜快照' },
    async () => {
      const data = await client().getTeamLeaderboard();
      return {
        contents: [
          {
            uri: 'honor://leaderboard/team',
            mimeType: 'application/json',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    },
  );

  server.prompt(
    'honor_weekly_summary',
    '根据排行榜与展播数据生成团队荣誉周报',
    { teamName: z.string().optional() },
    async (args) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `请根据 WindowOFHonor 系统数据，为${args.teamName ?? '本团队'}撰写一份简洁、庄重、有仪式感的本周荣誉周报。先调用 honor_get_leaderboard 和 honor_get_broadcast 获取数据。`,
          },
        },
      ],
    }),
  );

  server.prompt(
    'honor_praise_message',
    '根据激励记录生成表彰文案',
    { incentiveTitle: z.string(), recipientName: z.string() },
    async (args) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `请为「${args.recipientName}」撰写一段获得「${args.incentiveTitle}」荣誉的表彰文案，语气尊贵克制，适合奢侈品风展播大屏展示，80字以内。`,
          },
        },
      ],
    }),
  );

  return server;
}

async function startHttp() {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'windowofhonor-mcp' });
  });

  app.use((req, res, next) => {
    const key = process.env.MCP_API_KEY;
    if (!key) return next();
    const auth = req.headers.authorization;
    if (auth !== `Bearer ${key}`) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    next();
  });

  const mcpServer = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });
  await mcpServer.connect(transport);

  app.all('/mcp', async (req, res) => {
    await transport.handleRequest(req, res, req.body);
  });

  const port = Number(process.env.MCP_PORT ?? 3100);
  app.listen(port, '0.0.0.0', () => {
    console.log(`WindowOFHonor MCP (HTTP) on :${port}/mcp`);
  });
}

async function startStdio() {
  const mcpServer = createServer();
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error('WindowOFHonor MCP (stdio) ready');
}

const mode = process.env.MCP_TRANSPORT ?? 'http';
if (mode === 'stdio') {
  startStdio().catch(console.error);
} else {
  startHttp().catch(console.error);
}
