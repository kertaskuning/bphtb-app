const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('superadmin123', 10);
  await prisma.user.updateMany({
    where: { role: 'SUPERADMIN' },
    data: { password: hash }
  });
  console.log('Superadmin password reset successfully.');
}

main().catch(console.error).finally(async () => await prisma.$disconnect());
