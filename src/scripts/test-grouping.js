const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const normalizeAddress = (addr) => {
  let s = (addr || '').toUpperCase().trim();
  s = s.replace(/\bBLK\b/g, 'BLOK').replace(/\bJL\b/g, 'JALAN').replace(/\bJLN\b/g, 'JALAN').replace(/\bGG\b/g, 'GANG').replace(/\bKP\b/g, 'KAMPUNG').replace(/\bDS\b/g, 'DESA');
  return s.replace(/[^A-Z0-9]/g, '');
};

async function main() {
  const taxObjects = await prisma.taxObject.findMany({
    where: { address: { contains: 'TEGAL BUAH' } },
    include: {
      category: true,
      marketValueRecords: true
    }
  });

  const grouped = {};
  taxObjects.forEach(obj => {
    const catName = obj.category.name;
    if (!grouped[catName]) grouped[catName] = [];
    
    const addrNormalized = normalizeAddress(obj.address);
    const groupKey = `${addrNormalized}`;
    
    let existing = grouped[catName].find(g => g.groupKey === groupKey);
    
    if (!existing) {
      existing = {
        id: obj.id,
        groupKey,
        address: obj.address,
        zntCodeDisplay: new Set([obj.zntCode].filter(Boolean)),
        blokDisplay: new Set([obj.blok].filter(Boolean)),
        categoryId: obj.categoryId,
      };
      grouped[catName].push(existing);
    } else {
      if (obj.zntCode) existing.zntCodeDisplay.add(obj.zntCode);
      if (obj.blok) existing.blokDisplay.add(obj.blok);
    }
  });

  console.log("Original objects:", taxObjects.length);
  Object.keys(grouped).forEach(cat => {
    console.log(`Cat: ${cat} -> Groups:`, grouped[cat].map(g => ({
      address: g.address, 
      groupKey: g.groupKey, 
      znts: Array.from(g.zntCodeDisplay).join(','), 
      bloks: Array.from(g.blokDisplay).join(',')
    })));
  });
}
main().finally(() => prisma.$disconnect());
