const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const ids = ['cm5ca97370001f35swx1i2w04']; // Fake ID
  try {
    const result = await prisma.taxObject.updateMany({
      where: { id: { in: ids } },
      data: { isDeleted: true }
    });
    console.log(result);
  } catch (e) {
    console.error('ERROR:', e);
  }
}
test().finally(() => prisma.$disconnect());
