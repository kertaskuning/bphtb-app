const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const dists = await prisma.district.findMany({
    where: { name: { contains: 'KIARA' } },
    include: { villages: true }
  });
  dists.forEach(d => {
    console.log(`District: ${d.name} (ID: ${d.id})`);
    console.log(`Villages count: ${d.villages.length}`);
    d.villages.forEach(v => console.log(`  - ${v.name}`));
  });
}
main().finally(() => prisma.$disconnect());
