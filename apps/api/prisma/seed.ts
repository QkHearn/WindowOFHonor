import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log('数据库已有用户，跳过初始化。');
    return;
  }

  const username = process.env.SEED_SUPERADMIN_USERNAME?.trim() || 'superadmin';
  const password = process.env.SEED_SUPERADMIN_PASSWORD?.trim();
  if (!password) {
    throw new Error(
      '请设置环境变量 SEED_SUPERADMIN_PASSWORD 作为系统管理员初始密码。\n' +
        '示例: SEED_SUPERADMIN_PASSWORD=your_secure_password npm run prisma:seed',
    );
  }
  const displayName = process.env.SEED_SUPERADMIN_DISPLAY_NAME?.trim() || '系统管理员';

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      username,
      passwordHash,
      displayName,
      role: UserRole.super_admin,
    },
  });

  console.log('\n初始化完成：已创建系统管理员（数据库为空时执行）');
  console.log(`  用户名: ${username}`);
  console.log('  密码: 您配置的 SEED_SUPERADMIN_PASSWORD');
  console.log('  下一步: 登录后在「系统管理」中创建组织、人员与管理员');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
