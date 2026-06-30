const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const verifikator = await prisma.user.findUnique({ where: { username: 'verifikator' } });
  if (!verifikator) {
    console.log('Verifikator not found!');
  } else {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.update({
      where: { username: 'verifikator' },
      data: { password: hashedPassword, isPasswordChanged: false }
    });
    console.log('Verifikator password reset to admin123');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
