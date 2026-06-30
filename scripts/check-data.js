const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const filePath = "C:\\Users\\msyaf\\Downloads\\Daftarkelurahan desa.xlsx";
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const rawData = xlsx.utils.sheet_to_json(worksheet);
  console.log('Total rows in Excel:', rawData.length);
  if (rawData.length > 0) {
    console.log('Sample row (first row):', rawData[0]);
  }
  console.log('Valid rows in Excel (with KECAMATAN and DESA/KELURAHAN):', validExcelRows);

  const dbVillages = await prisma.village.count();
  console.log('Total villages in Database:', dbVillages);

  const dbDistricts = await prisma.district.count();
  console.log('Total districts in Database:', dbDistricts);

  const dbKolektors = await prisma.user.count({ where: { role: 'KOLEKTOR' } });
  console.log('Total KOLEKTOR in Database:', dbKolektors);
}

main().catch(console.error).finally(() => prisma.$disconnect());
