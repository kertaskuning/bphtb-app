const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function normalizeString(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function main() {
  const allVillages = await prisma.village.findMany({ include: { district: true, taxObjects: true } });
  
  // Find duplicates based on normalized name
  const normalizedMap = {};
  const toDelete = [];
  
  for (const v of allVillages) {
    const normName = normalizeString(v.name);
    const normDistrict = normalizeString(v.district.name);
    const key = `${normDistrict}-${normName}`;
    
    if (!normalizedMap[key]) {
      normalizedMap[key] = [];
    }
    normalizedMap[key].push(v);
  }
  
  for (const key in normalizedMap) {
    const group = normalizedMap[key];
    if (group.length > 1) {
      console.log(`Found duplicates for ${key}:`);
      group.forEach(v => console.log(`  - ${v.name} (TaxObjects: ${v.taxObjects.length})`));
      
      // Keep the one WITH TaxObjects, delete the one without
      const withData = group.filter(v => v.taxObjects.length > 0);
      const withoutData = group.filter(v => v.taxObjects.length === 0);
      
      if (withData.length === 1 && withoutData.length > 0) {
        withoutData.forEach(v => toDelete.push(v.id));
      } else {
        console.log('  -> Cannot resolve automatically!');
      }
    }
  }
  
  console.log(`\nFound ${toDelete.length} duplicates to delete.`);
  
  for (const id of toDelete) {
    // Delete KOLEKTOR first
    await prisma.user.deleteMany({ where: { villageId: id } });
    // Delete Village
    await prisma.village.delete({ where: { id } });
  }
  
  console.log('Duplicates deleted.');
  
  const finalCount = await prisma.village.count();
  console.log(`Total villages remaining: ${finalCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
