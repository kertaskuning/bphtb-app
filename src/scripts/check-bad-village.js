const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const badDistrict = await prisma.district.findUnique({
    where: { id: 'cmqu9fd3t000g8eulllzjgeen' },
    include: { villages: { include: { taxObjects: true } } }
  });
  
  if (badDistrict) {
    badDistrict.villages.forEach(v => {
      console.log(`Village: ${v.name}, Tax objects: ${v.taxObjects.length}`);
    });
  }
}
main().finally(() => prisma.$disconnect());
