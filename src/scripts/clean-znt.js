const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Fetching all TaxObjects with ZNT codes...');
  const objects = await prisma.taxObject.findMany({
    where: {
      zntCode: {
        not: null
      }
    }
  });
  
  let updated = 0;
  
  // Use a transaction or batch updates for speed, but since it's just a cleanup, sequential is fine.
  // Actually, let's collect IDs and do updateMany.
  
  const invalidIds = [];
  
  for (const obj of objects) {
    const code = obj.zntCode.trim().toUpperCase();
    // Only accept exactly 2 uppercase letters
    if (!/^[A-Z]{2}$/.test(code)) {
      invalidIds.push(obj.id);
    }
  }
  
  console.log(`Found ${invalidIds.length} invalid ZNT codes (e.g. numbers instead of letters).`);
  
  if (invalidIds.length > 0) {
    // Update in chunks to avoid SQLite limits
    const chunkSize = 500;
    for (let i = 0; i < invalidIds.length; i += chunkSize) {
      const chunk = invalidIds.slice(i, i + chunkSize);
      await prisma.taxObject.updateMany({
        where: { id: { in: chunk } },
        data: { zntCode: null }
      });
    }
    console.log(`Successfully cleared ${invalidIds.length} invalid ZNT codes.`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
