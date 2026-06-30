const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const allObjects = await prisma.taxObject.findMany({
    take: 5,
    include: { village: true }
  });
  console.log('Sample Tax Objects:');
  allObjects.forEach(o => {
    console.log(`- ID: ${o.id}, Village ID: ${o.villageId}, Village:`, o.village ? o.village.name : 'NULL');
  });
  
  const total = await prisma.taxObject.count();
  console.log(`Total: ${total}`);
}
main().finally(() => prisma.$disconnect());
