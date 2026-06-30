const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  console.log('Membaca data dari database-dump.json...');
  const data = JSON.parse(fs.readFileSync('database-dump.json', 'utf8'));

  console.log('Memasukkan data ke Supabase PostgreSQL...');

  // Kita gunakan createMany untuk mempercepat proses (atau loop jika tabel memiliki relasi ketat)
  // 1. Districts
  if (data.districts.length > 0) {
    console.log(`Mengembalikan ${data.districts.length} kecamatan...`);
    await prisma.district.createMany({ data: data.districts, skipDuplicates: true });
  }

  // 2. Villages
  if (data.villages.length > 0) {
    console.log(`Mengembalikan ${data.villages.length} desa...`);
    await prisma.village.createMany({ data: data.villages, skipDuplicates: true });
  }

  // 3. Categories
  if (data.categories.length > 0) {
    console.log(`Mengembalikan ${data.categories.length} kategori...`);
    await prisma.taxObjectCategory.createMany({ data: data.categories, skipDuplicates: true });
  }

  // 4. Users
  if (data.users.length > 0) {
    console.log(`Mengembalikan ${data.users.length} akun pengguna...`);
    await prisma.user.createMany({ data: data.users, skipDuplicates: true });
  }

  // 5. Tax Objects (7500+ records) - Kita bagi per batch agar tidak error memori
  if (data.taxObjects.length > 0) {
    console.log(`Mengembalikan ${data.taxObjects.length} alamat objek pajak...`);
    const batchSize = 1000;
    for (let i = 0; i < data.taxObjects.length; i += batchSize) {
      const batch = data.taxObjects.slice(i, i + batchSize);
      await prisma.taxObject.createMany({ data: batch, skipDuplicates: true });
      console.log(`  - Memasukkan batch ${Math.floor(i/batchSize) + 1} (${batch.length} data)`);
    }
  }

  // 6. Market Value Records (7500+ records)
  if (data.marketValueRecords.length > 0) {
    console.log(`Mengembalikan ${data.marketValueRecords.length} catatan nilai pasar...`);
    const batchSize = 1000;
    for (let i = 0; i < data.marketValueRecords.length; i += batchSize) {
      const batch = data.marketValueRecords.slice(i, i + batchSize);
      await prisma.marketValueRecord.createMany({ data: batch, skipDuplicates: true });
      console.log(`  - Memasukkan batch ${Math.floor(i/batchSize) + 1} (${batch.length} data)`);
    }
  }

  console.log('Selesai! Seluruh data berhasil dipulihkan ke Supabase.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
