const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const STANDARD_CATEGORIES = [
  "JL PROTOKOL",
  "JL LINGKUNGAN",
  "JL EKONOMI",
  "PERKAMPUNGAN/PEMUKIMAN",
  "TANAH PERTANIAN"
];

function mapToStandard(raw) {
  const upper = raw.toUpperCase().replace(/^\/+/, '').trim();
  if (upper.includes('PROTOKOL')) return "JL PROTOKOL";
  if (upper.includes('EKONOMI') && !upper.includes('KAMPUNG')) return "JL EKONOMI";
  if (upper.includes('LINGKUNGAN') && !upper.includes('KAMPUNG')) return "JL LINGKUNGAN";
  if (upper.includes('KAMPUNG') || upper.includes('MUKIM') || upper.includes('PEMUKIMAN')) return "PERKAMPUNGAN/PEMUKIMAN";
  if (upper.includes('TANI') || upper.includes('SAWAH') || upper.includes('PERANIAN') || upper.includes('PERNAIAN') || upper === 'TANAH') return "TANAH PERTANIAN";
  if (upper === 'JALAN' || upper === 'JL') return "JL LINGKUNGAN";
  
  return "JL LINGKUNGAN"; // Default fallback
}

async function main() {
  // 1. Ensure all standard categories exist
  const standardIds = {};
  for (const name of STANDARD_CATEGORIES) {
    let cat = await prisma.taxObjectCategory.findFirst({ where: { name } });
    if (!cat) {
      cat = await prisma.taxObjectCategory.create({ data: { name } });
    }
    standardIds[name] = cat.id;
  }

  // 2. Fetch all existing categories
  const allCategories = await prisma.taxObjectCategory.findMany();

  for (const cat of allCategories) {
    // If it's already a standard exact match, skip
    if (STANDARD_CATEGORIES.includes(cat.name)) continue;

    const mappedName = mapToStandard(cat.name);
    const targetId = standardIds[mappedName];

    // Move all tax objects
    await prisma.taxObject.updateMany({
      where: { categoryId: cat.id },
      data: { categoryId: targetId }
    });

    // Delete old category
    await prisma.taxObjectCategory.delete({ where: { id: cat.id } });
    console.log(`Mapped [${cat.name}] -> [${mappedName}]`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
