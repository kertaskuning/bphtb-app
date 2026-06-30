const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const district = await prisma.district.findFirst({
    where: { name: 'KIARA PEDES' },
    include: { villages: true }
  });
  console.log(`District: ${district?.name}`);
  console.log(`Villages count: ${district?.villages.length}`);
  district?.villages.forEach(v => console.log(`- ${v.name}`));
}
main().finally(() => prisma.$disconnect());
