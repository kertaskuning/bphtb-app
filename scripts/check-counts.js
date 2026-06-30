const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dbVillages = await prisma.village.count();
  console.log('Total villages in Database:', dbVillages);

  const dbDistricts = await prisma.district.count();
  console.log('Total districts in Database:', dbDistricts);

  const dbKolektors = await prisma.user.count({ where: { role: 'KOLEKTOR' } });
  console.log('Total KOLEKTOR in Database:', dbKolektors);
}

main().catch(console.error).finally(() => prisma.$disconnect());
