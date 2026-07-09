import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { execSync } from 'node:child_process';

export const prisma = new PrismaClient();

export async function resetDatabase() {
  await prisma.like.deleteMany();
  await prisma.taskOrder.deleteMany();
  await prisma.incentiveRecipient.deleteMany();
  await prisma.incentiveRecord.deleteMany();
  await prisma.coHonorEdge.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.incentiveType.deleteMany();
}

export async function migrateDatabase() {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: process.env,
  });
}

export interface TestUsers {
  deptId: string;
  supervisor: { id: string; token?: string };
  employeeA: { id: string; token?: string };
  employeeB: { id: string; token?: string };
}

export async function seedTestUsers(): Promise<TestUsers> {
  const dept = await prisma.department.create({
    data: { name: '测试团队' },
  });

  const hash = await bcrypt.hash('test123', 10);

  const supervisor = await prisma.user.create({
    data: {
      username: 'test_supervisor',
      passwordHash: hash,
      displayName: '测试主管',
      role: UserRole.supervisor,
      departmentId: dept.id,
      honorPoints: 50,
    },
  });

  const employeeA = await prisma.user.create({
    data: {
      username: 'test_emp_a',
      passwordHash: hash,
      displayName: '员工甲',
      role: UserRole.employee,
      departmentId: dept.id,
      honorPoints: 100,
    },
  });

  const employeeB = await prisma.user.create({
    data: {
      username: 'test_emp_b',
      passwordHash: hash,
      displayName: '员工乙',
      role: UserRole.employee,
      departmentId: dept.id,
      honorPoints: 80,
    },
  });

  return {
    deptId: dept.id,
    supervisor: { id: supervisor.id },
    employeeA: { id: employeeA.id },
    employeeB: { id: employeeB.id },
  };
}

export async function disconnect() {
  await prisma.$disconnect();
}
