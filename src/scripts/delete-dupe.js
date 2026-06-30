const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const badDistrict = await prisma.district.findUnique({
    where: { id: 'cmqu9fd3t000g8eulllzjgeen' },
    include: { users: true }
  });
  console.log(`Users attached: ${badDistrict?.users?.length}`);
  
  if (badDistrict?.users?.length === 0) {
    // Delete village first
    await prisma.village.deleteMany({ where: { districtId: 'cmqu9fd3t000g8eulllzjgeen' } });
    await prisma.district.delete({ where: { id: 'cmqu9fd3t000g8eulllzjgeen' } });
    console.log('Duplicate district and village deleted.');
  } else {
    console.log('Cannot delete, users are attached!');
  }
}
main().finally(() => prisma.$disconnect());
