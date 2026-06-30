const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const objects = await prisma.taxObject.findMany({
    where: { blok: { not: null } },
    select: { blok: true }
  });
  const uniqueBloks = [...new Set(objects.map(o => o.blok))];
  console.log('Total unique blocks:', uniqueBloks.length);
  console.log(uniqueBloks.slice(0, 100));
}

main().finally(() => prisma.$disconnect());
