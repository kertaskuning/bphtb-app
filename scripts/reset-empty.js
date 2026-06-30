const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.marketValueRecord.updateMany({
    where: {
      status: 'SUBMITTED',
      OR: [
        { minValue: null, maxValue: null },
        { minValue: 0, maxValue: 0 },
        { minValue: 0, maxValue: null },
        { minValue: null, maxValue: 0 }
      ]
    },
    data: {
      status: 'PENDING'
    }
  });
  console.log(`Reset ${result.count} empty submitted records back to PENDING.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
