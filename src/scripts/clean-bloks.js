const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Fetching all TaxObjects with bloks...');
  const objects = await prisma.taxObject.findMany({
    where: {
      blok: {
        not: null
      }
    }
  });
  
  let updated = 0;
  let cleared = 0;
  
  for (const obj of objects) {
    const raw = obj.blok.trim();
    if (raw === '' || raw === '-') {
      await prisma.taxObject.update({
        where: { id: obj.id },
        data: { blok: null }
      });
      cleared++;
      continue;
    }
    
    // Check if it perfectly matches 1 to 3 digits
    if (/^\d{1,3}$/.test(raw)) {
      continue; // already good
    }
    
    // Try to extract the first sequence of digits
    const match = raw.match(/\d+/);
    if (match) {
      // take up to 3 digits
      const newBlok = match[0].substring(0, 3);
      await prisma.taxObject.update({
        where: { id: obj.id },
        data: { blok: newBlok }
      });
      updated++;
    } else {
      // no numbers found
      await prisma.taxObject.update({
        where: { id: obj.id },
        data: { blok: null }
      });
      cleared++;
    }
  }
  
  console.log(`Successfully fixed ${updated} bloks and cleared ${cleared} invalid bloks.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
