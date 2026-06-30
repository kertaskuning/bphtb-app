const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.taxObject.count({ where: { isDeleted: false } });
  const countTrue = await prisma.taxObject.count({ where: { isDeleted: true } });
  const allCount = await prisma.taxObject.count();
  console.log('isDeleted=false:', count);
  console.log('isDeleted=true:', countTrue);
  console.log('Total:', allCount);
}
main().finally(() => prisma.$disconnect());
