const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Excel seed process...');
  
  // 1. Delete existing data
  console.log('Clearing old TaxObject and MarketValueRecord data...');
  await prisma.marketValueRecord.deleteMany({});
  await prisma.taxObject.deleteMany({});
  console.log('Old data cleared.');

  // 2. Fetch required reference data
  console.log('Fetching reference data (Districts, Villages, Categories)...');
  const districts = await prisma.district.findMany();
  const villages = await prisma.village.findMany();
  const categories = await prisma.taxObjectCategory.findMany();

  const getDistrictId = (name) => {
    if (!name) return null;
    const clean = name.trim().toUpperCase();
    const d = districts.find(d => d.name.toUpperCase() === clean);
    return d ? d.id : null;
  };

  const getVillageId = (name, districtId) => {
    if (!name || !districtId) return null;
    const clean = name.trim().toUpperCase();
    const v = villages.find(v => v.name.toUpperCase() === clean && v.districtId === districtId);
    return v ? v.id : null;
  };

  const getCategoryId = (name) => {
    if (!name) return null;
    const clean = name.trim().toUpperCase();
    const c = categories.find(c => c.name.toUpperCase() === clean || c.name.toUpperCase().includes(clean));
    return c ? c.id : null;
  };

  // 3. Read Excel File
  const filePath = 'C:/Users/msyaf/Downloads/Data Base Nilai Pasar 2027 (1).xlsx';
  console.log(`Reading Excel file: ${filePath}`);
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['Nilai Wajar'];
  
  if (!sheet) {
    console.error('Sheet "Nilai Wajar" not found!');
    process.exit(1);
  }

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  let currentDistrictId = null;
  let currentVillageId = null;
  let currentCategoryId = null;

  let insertedObjects = 0;
  
  const createBatch = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const col0 = typeof row[0] === 'string' ? row[0].trim() : row[0];
    const col1 = typeof row[1] === 'string' ? row[1].trim() : row[1];
    const col2 = typeof row[2] === 'string' ? row[2].trim() : row[2];

    if (col0 === 'KECAMATAN') {
      const distName = (col2 || '').replace(':', '').trim();
      currentDistrictId = getDistrictId(distName);
      if (!currentDistrictId) console.warn(`District not found in DB: ${distName}`);
    } 
    else if (col0 === 'DESA' || col0 === 'KELURAHAN') {
      const villName = (col2 || '').replace(':', '').trim();
      currentVillageId = getVillageId(villName, currentDistrictId);
      if (!currentVillageId) console.warn(`Village not found in DB: ${villName} (District: ${currentDistrictId})`);
    } 
    else if (col0 && !isNaN(parseInt(col0))) {
      // It's a category row (e.g. 1 JL PROTOKOL)
      currentCategoryId = getCategoryId(col1);
      
      // Some category rows ALSO contain the first data row right away!
      if (col2 && typeof col2 === 'string' && currentDistrictId && currentVillageId && currentCategoryId) {
        if (col2 !== 'ALAMAT OBJEK PAJAK' && col2 !== 'ALAMAT' && col2 !== '0') {
           let znt = row[3] ? row[3].toString().trim().toUpperCase() : null;
           if (znt && !/^[A-Z]{2}$/.test(znt)) znt = null;
           const blok = row[6] ? row[6].toString().trim() : null;
           
           createBatch.push({
             villageId: currentVillageId,
             categoryId: currentCategoryId,
             address,
             zntCode: znt,
             blok,
             marketValueRecords: {
               create: {
                 status: 'PENDING'
               }
             }
           });
           insertedObjects++;
        }
      }
    } 
    else if (col2 && typeof col2 === 'string' && col2.trim() !== '') {
      // It's a continuation data row
      if (col2 === 'ALAMAT OBJEK PAJAK' || col2 === 'ALAMAT' || col2 === '0') continue;
      if (!currentDistrictId || !currentVillageId || !currentCategoryId) continue;

      const address = col2.trim();
      let znt = row[3] ? row[3].toString().trim().toUpperCase() : null;
      if (znt && !/^[A-Z]{2}$/.test(znt)) znt = null;
      const blok = row[6] ? row[6].toString().trim() : null;
      
      createBatch.push({
        villageId: currentVillageId,
        categoryId: currentCategoryId,
        address,
        zntCode: znt,
        blok,
        marketValueRecords: {
          create: {
            status: 'PENDING'
          }
        }
      });
      insertedObjects++;
    }
  }

  console.log(`Found ${createBatch.length} valid tax objects to insert.`);
  
  // Insert in batches
  const batchSize = 100;
  for (let i = 0; i < createBatch.length; i += batchSize) {
    const chunk = createBatch.slice(i, i + batchSize);
    for (const data of chunk) {
      await prisma.taxObject.create({ data });
    }
    process.stdout.write(`\rInserted ${Math.min(i + batchSize, createBatch.length)} / ${createBatch.length}`);
  }
  
  console.log('\nSeed process completed successfully!');
}

main()
  .catch(e => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
