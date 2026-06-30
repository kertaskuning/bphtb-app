const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Find or create TANAH PERTANIAN
  let targetCat = await prisma.taxObjectCategory.findFirst({ where: { name: 'TANAH PERTANIAN' } });
  if (!targetCat) {
    targetCat = await prisma.taxObjectCategory.create({ data: { name: 'TANAH PERTANIAN' } });
  }

  // 2. Find TANAH
  const tanahCat = await prisma.taxObjectCategory.findFirst({ where: { name: 'TANAH' } });
  if (tanahCat) {
    await prisma.taxObject.updateMany({
      where: { categoryId: tanahCat.id },
      data: { categoryId: targetCat.id }
    });
    await prisma.taxObjectCategory.delete({ where: { id: tanahCat.id } });
    console.log('Merged TANAH into TANAH PERTANIAN');
  }

  // 3. Find PERTANIAN
  const pertanianCat = await prisma.taxObjectCategory.findFirst({ where: { name: 'PERTANIAN' } });
  if (pertanianCat) {
    await prisma.taxObject.updateMany({
      where: { categoryId: pertanianCat.id },
      data: { categoryId: targetCat.id }
    });
    await prisma.taxObjectCategory.delete({ where: { id: pertanianCat.id } });
    console.log('Merged PERTANIAN into TANAH PERTANIAN');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
