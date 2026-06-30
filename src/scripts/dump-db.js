const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  console.log('Mengekspor data dari SQLite...');
  
  const users = await prisma.user.findMany();
  const districts = await prisma.district.findMany();
  const villages = await prisma.village.findMany();
  const categories = await prisma.taxObjectCategory.findMany();
  const taxObjects = await prisma.taxObject.findMany();
  const marketValueRecords = await prisma.marketValueRecord.findMany();

  const data = {
    users,
    districts,
    villages,
    categories,
    taxObjects,
    marketValueRecords
  };

  fs.writeFileSync('database-dump.json', JSON.stringify(data, null, 2));
  console.log(`Berhasil mengekspor:
  - ${users.length} Users
  - ${districts.length} Districts
  - ${villages.length} Villages
  - ${categories.length} Categories
  - ${taxObjects.length} Tax Objects
  - ${marketValueRecords.length} Market Value Records
  Tersimpan dalam file database-dump.json`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
