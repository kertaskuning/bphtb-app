const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  const filePath = 'C:\\Users\\msyaf\\Downloads\\Data Base Nilai Pasar 2027 (1).xlsx';
  if (!fs.existsSync(filePath)) {
    console.error('Excel file not found at:', filePath);
    return;
  }

  const workbook = xlsx.readFile(filePath);
  const worksheet = workbook.Sheets['Nilai Wajar'];
  if (!worksheet) {
    console.error('Sheet "Nilai Wajar" not found');
    return;
  }

  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  // Clear existing data (optional, but good for reset)
  await prisma.marketValueRecord.deleteMany();
  await prisma.taxObject.deleteMany();
  await prisma.taxObjectCategory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.village.deleteMany();
  await prisma.district.deleteMany();

  // Create Superadmin and Verifikator
  const superadminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: { username: 'superadmin', password: superadminPassword, role: 'SUPERADMIN', isPasswordChanged: true },
  });
  await prisma.user.create({
    data: { username: 'verifikator', password: superadminPassword, role: 'VERIFIKATOR', isPasswordChanged: true },
  });

  let currentDistrict = null;
  let currentVillage = null;
  let currentCategory = null;

  let districtDb = null;
  let villageDb = null;
  let categoryDb = null;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    // Check for KECAMATAN
    if (typeof row[0] === 'string' && row[0].trim() === 'KECAMATAN') {
      const districtName = String(row[2]).replace(':', '').trim();
      if (currentDistrict !== districtName) {
        currentDistrict = districtName;
        // Create or find district
        districtDb = await prisma.district.findFirst({ where: { name: districtName } });
        if (!districtDb) {
          districtDb = await prisma.district.create({ data: { name: districtName } });
        }
      }
      continue;
    }

    // Check for DESA
    if (typeof row[0] === 'string' && row[0].trim() === 'DESA') {
      const villageName = String(row[2]).replace(':', '').trim();
      if (currentVillage !== villageName) {
        currentVillage = villageName;
        // Create or find village
        if (districtDb) {
          villageDb = await prisma.village.findFirst({ where: { name: villageName, districtId: districtDb.id } });
          if (!villageDb) {
            villageDb = await prisma.village.create({ data: { name: villageName, districtId: districtDb.id } });
            
            // Create Kolektor User for this village
            const formattedKec = districtNameFormat(currentDistrict);
            const formattedDesa = villageNameFormat(villageName);
            const username = `${formattedDesa}_${formattedKec}`;
            const hashedPassword = await bcrypt.hash('12345678', 10);
            
            await prisma.user.create({
              data: {
                username: username,
                password: hashedPassword,
                role: 'KOLEKTOR',
                isPasswordChanged: false,
                villageId: villageDb.id
              }
            });
          }
        }
      }
      continue;
    }

    // Check if it's a category header (e.g. JL PROTOKOL) where row[1] exists but row[2] is empty or undefined
    // Or if row[1] exists, we update currentCategory
    if (row[1] && typeof row[1] === 'string' && row[1] !== 'LOKASI OBJEK PAJAK' && row[1] !== 'TERENDAH') {
      const categoryName = mapToStandard(row[1]);
      // Find or create category
      categoryDb = await prisma.taxObjectCategory.findFirst({ where: { name: categoryName } });
      if (!categoryDb) {
        categoryDb = await prisma.taxObjectCategory.create({ data: { name: categoryName } });
      }
    }

    // Check if it's an address record: row[2] has the ALAMAT
    if (row[2] && typeof row[2] === 'string' && row[2] !== 'ALAMAT OBJEK PAJAK') {
      if (!villageDb || !categoryDb) continue;

      const address = row[2].trim();
      const zntCode = row[3] ? String(row[3]).trim() : null;
      const blok = row[6] ? String(row[6]).trim() : null;

      const taxObject = await prisma.taxObject.create({
        data: {
          address,
          zntCode,
          blok,
          categoryId: categoryDb.id,
          villageId: villageDb.id,
        }
      });

      // Create MarketValueRecord entry pending
      await prisma.marketValueRecord.create({
        data: {
          taxObjectId: taxObject.id,
          status: 'PENDING'
        }
      });
    }
  }

  console.log('Seeding completed!');
}

function districtNameFormat(name) {
  return name.replace(/\s+/g, '');
}

function villageNameFormat(name) {
  return name.replace(/\s+/g, '');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
