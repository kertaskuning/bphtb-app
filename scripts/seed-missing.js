const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function districtNameFormat(name) {
  return name.replace(/\s+/g, '');
}

function villageNameFormat(name) {
  return name.replace(/\s+/g, '');
}

async function main() {
  const filePath = "C:\\Users\\msyaf\\Downloads\\Daftarkelurahan desa.xlsx";
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const rawData = xlsx.utils.sheet_to_json(worksheet);
  console.log(`Found ${rawData.length} rows in the Excel file.`);

  const defaultPassword = await bcrypt.hash('12345678', 10);
  let addedVillages = 0;
  let addedKolektors = 0;

  for (const row of rawData) {
    const districtName = String(row['nm_kecamatan']).trim();
    const villageName = String(row['nm_kelurahan']).trim();

    if (!districtName || !villageName) continue;

    // 1. Find or create district
    let district = await prisma.district.findFirst({ where: { name: districtName } });
    if (!district) {
      district = await prisma.district.create({ data: { name: districtName } });
    }

    // 2. Find or create village
    let village = await prisma.village.findFirst({ 
      where: { name: villageName, districtId: district.id } 
    });
    
    if (!village) {
      village = await prisma.village.create({ 
        data: { name: villageName, districtId: district.id } 
      });
      addedVillages++;
    }

    // 3. Find or create KOLEKTOR account
    const kolektorAccount = await prisma.user.findFirst({
      where: { role: 'KOLEKTOR', villageId: village.id }
    });

    if (!kolektorAccount) {
      const formattedKec = districtNameFormat(districtName);
      const formattedDesa = villageNameFormat(villageName);
      const username = `${formattedDesa}_${formattedKec}`;

      // ensure username is unique
      let finalUsername = username;
      let counter = 1;
      let existingUser = await prisma.user.findUnique({ where: { username: finalUsername } });
      while (existingUser) {
        finalUsername = `${username}_${counter}`;
        counter++;
        existingUser = await prisma.user.findUnique({ where: { username: finalUsername } });
      }

      await prisma.user.create({
        data: {
          username: finalUsername,
          password: defaultPassword,
          role: 'KOLEKTOR',
          villageId: village.id,
          isPasswordChanged: false
        }
      });
      addedKolektors++;
    }
  }

  console.log(`Seeding complete. Added ${addedVillages} missing villages and ${addedKolektors} missing KOLEKTOR accounts.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
