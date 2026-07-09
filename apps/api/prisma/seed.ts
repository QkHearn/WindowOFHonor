import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const dept = await prisma.department.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: '研发一部',
    },
  });

  const passwordHash = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash,
      displayName: '系统主管',
      role: UserRole.supervisor,
      departmentId: dept.id,
      honorPoints: 100,
    },
  });

  const employees = [
    { username: 'zhangsan', displayName: '张三', honorPoints: 285 },
    { username: 'lisi', displayName: '李四', honorPoints: 260 },
    { username: 'wangwu', displayName: '王五', honorPoints: 180 },
  ];

  for (const e of employees) {
    await prisma.user.upsert({
      where: { username: e.username },
      update: {},
      create: {
        username: e.username,
        passwordHash: await bcrypt.hash('123456', 10),
        displayName: e.displayName,
        role: UserRole.employee,
        departmentId: dept.id,
        honorPoints: e.honorPoints,
      },
    });
  }

  console.log('Seed completed: admin/admin123, employees/123456');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
