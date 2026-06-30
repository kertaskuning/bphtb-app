const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { username: 'superadmin' } });
  console.log('Superadmin:', user);
}

main().catch(console.error).finally(() => prisma.$disconnect());
