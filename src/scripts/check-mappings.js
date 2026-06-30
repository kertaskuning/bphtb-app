const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const obj = await prisma.taxObject.findFirst({ include: { village: true } });
  console.log("Tax object village:", obj.village);
  const villages = await prisma.village.findMany({
    include: {
      taxObjects: true
    }
  });
  const villagesWithTaxObjects = villages.filter(v => v.taxObjects.length > 0);
  console.log('Total villages:', villages.length);
  console.log('Villages with tax objects:', villagesWithTaxObjects.length);
}
main().finally(() => prisma.$disconnect());
