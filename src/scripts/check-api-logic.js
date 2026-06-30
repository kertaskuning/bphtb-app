const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const villages = await prisma.village.findMany({
    include: {
      district: true,
      taxObjects: {
        include: {
          marketValueRecords: true
        }
      }
    }
  });

  const villageProgress = villages.map(village => {
    return {
      id: village.id,
      name: village.name,
      totalTaxObjects: village.taxObjects.length
    };
  });

  console.log("Total villages:", villageProgress.length);
  console.log("Villages with > 0 tax objects:", villageProgress.filter(v => v.totalTaxObjects > 0).length);
  
  const cibinbin = villageProgress.find(v => v.name === 'CIBINBIN');
  console.log("CIBINBIN stats:", cibinbin);
}

main().finally(() => prisma.$disconnect());
