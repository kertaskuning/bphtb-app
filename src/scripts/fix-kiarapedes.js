const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const badDistrictId = 'cmqu9fd3t000g8eulllzjgeen';
  const goodDistrictId = 'cmqt8fe5g08ua12b8c2rcv284';

  // 1. Reassign users
  await prisma.user.updateMany({
    where: { districtId: badDistrictId },
    data: { districtId: goodDistrictId }
  });
  console.log('Users reassigned to the correct KIARAPEDES.');

  // 2. Delete the duplicate village
  await prisma.village.deleteMany({
    where: { districtId: badDistrictId }
  });
  console.log('Duplicate village deleted.');

  // 3. Delete the duplicate district
  await prisma.district.delete({
    where: { id: badDistrictId }
  });
  console.log('Duplicate district deleted.');
}
main().finally(() => prisma.$disconnect());
