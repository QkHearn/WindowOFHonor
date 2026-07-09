import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import {
  disconnect,
  migrateDatabase,
  prisma,
  resetDatabase,
  seedTestUsers,
  TestUsers,
} from './helpers/test-db';

describe('WindowOFHonor API (e2e)', () => {
  let app: INestApplication<App>;
  let users: TestUsers;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not set — skipping e2e tests');
      return;
    }

    await migrateDatabase();
    await resetDatabase();
    users = await seedTestUsers();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const loginSupervisor = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'test_supervisor', password: 'test123' });
    users.supervisor.token = loginSupervisor.body.accessToken;

    const loginA = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'test_emp_a', password: 'test123' });
    users.employeeA.token = loginA.body.accessToken;
  });

  afterAll(async () => {
    if (app) await app.close();
    await disconnect();
  });

  const skipIfNoDb = () => !process.env.DATABASE_URL;

  it('GET /api/health', async () => {
    if (skipIfNoDb()) return;
    const res = await request(app.getHttpServer()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /api/auth/login rejects bad password', async () => {
    if (skipIfNoDb()) return;
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'test_supervisor', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/login returns token', async () => {
    if (skipIfNoDb()) return;
    expect(users.supervisor.token).toBeDefined();
  });

  it('POST /api/incentives issues honor to multiple employees', async () => {
    if (skipIfNoDb()) return;
    const res = await request(app.getHttpServer())
      .post('/api/incentives')
      .set('Authorization', `Bearer ${users.supervisor.token}`)
      .send({
        title: 'E2E 共获荣誉',
        description: '集成测试',
        recipientIds: [users.employeeA.id, users.employeeB.id],
        honorValue: 15,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updatedA = await prisma.user.findUnique({ where: { id: users.employeeA.id } });
    expect(updatedA?.honorPoints).toBe(115);
  });

  it('GET /api/broadcast/honors includes new incentive', async () => {
    if (skipIfNoDb()) return;
    const res = await request(app.getHttpServer()).get('/api/broadcast/honors');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].title).toBe('E2E 共获荣誉');
  });

  it('GET /api/leaderboard/personal returns ranked users', async () => {
    if (skipIfNoDb()) return;
    const res = await request(app.getHttpServer()).get('/api/leaderboard/personal');
    expect(res.status).toBe(200);
    expect(res.body[0].rank).toBe(1);
    expect(res.body[0].honorValue).toBeGreaterThan(0);
  });

  it('GET /api/leaderboard/team returns team ranking', async () => {
    if (skipIfNoDb()) return;
    const res = await request(app.getHttpServer()).get('/api/leaderboard/team');
    expect(res.status).toBe(200);
    expect(res.body[0].teamName).toBe('测试团队');
  });

  it('GET /api/users/:id/partners returns co-honor partners', async () => {
    if (skipIfNoDb()) return;
    const res = await request(app.getHttpServer()).get(
      `/api/users/${users.employeeA.id}/partners`,
    );
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].coCount).toBe(1);
  });

  it('GET /api/users/me/co-honor-network returns graph', async () => {
    if (skipIfNoDb()) return;
    const res = await request(app.getHttpServer())
      .get('/api/users/me/co-honor-network')
      .set('Authorization', `Bearer ${users.employeeA.token}`);
    expect(res.status).toBe(200);
    expect(res.body.nodes.length).toBeGreaterThan(1);
    expect(res.body.bestPartner).toBeDefined();
  });

  it('POST /api/likes creates like', async () => {
    if (skipIfNoDb()) return;
    const res = await request(app.getHttpServer())
      .post('/api/likes')
      .set('Authorization', `Bearer ${users.employeeA.token}`)
      .send({
        toUserId: users.employeeB.id,
        targetType: 'user_profile',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/likes rejects self-like', async () => {
    if (skipIfNoDb()) return;
    const res = await request(app.getHttpServer())
      .post('/api/likes')
      .set('Authorization', `Bearer ${users.employeeA.token}`)
      .send({
        toUserId: users.employeeA.id,
        targetType: 'user_profile',
      });
    expect(res.status).toBe(400);
  });

  it('GET /api/users/search finds employees', async () => {
    if (skipIfNoDb()) return;
    const res = await request(app.getHttpServer())
      .get('/api/users/search?q=员工')
      .set('Authorization', `Bearer ${users.supervisor.token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it('MCP service token can access protected routes', async () => {
    if (skipIfNoDb()) return;
    const res = await request(app.getHttpServer())
      .get('/api/incentives')
      .set('X-Service-Token', process.env.MCP_SERVICE_TOKEN!);
    expect(res.status).toBe(200);
  });
});
