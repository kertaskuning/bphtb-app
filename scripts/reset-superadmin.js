const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const superadmin = await prisma.user.findUnique({ where: { username: 'superadmin' } });
  if (!superadmin) {
    console.log('Superadmin not found!');
  } else {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.update({
      where: { username: 'superadmin' },
      data: { password: hashedPassword, isPasswordChanged: false }
    });
    console.log('Superadmin password reset to admin123');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
