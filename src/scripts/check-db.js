const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.taxObject.count();
  console.log('Total Tax Objects:', count);
}
main().finally(() => prisma.$disconnect());
