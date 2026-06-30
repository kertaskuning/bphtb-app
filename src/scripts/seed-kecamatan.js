const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Kecamatan Users...');
  
  const districts = await prisma.district.findMany();
  
  if (districts.length === 0) {
    console.log('No districts found. Run seed-excel.js first.');
    return;
  }

  const hashedPassword = await bcrypt.hash('12345678', 10);
  let count = 0;

  for (const district of districts) {
    // Clean up the name for the username (lowercase, remove spaces)
    const username = `kec_${district.name.toLowerCase().replace(/\s+/g, '')}`;
    
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { username }
    });

    if (!existing) {
      await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          role: 'KECAMATAN',
          districtId: district.id,
          isPasswordChanged: false
        }
      });
      console.log(`Created user: ${username} for District: ${district.name}`);
      count++;
    } else {
      // Ensure the districtId is linked
      await prisma.user.update({
        where: { username },
        data: { districtId: district.id, role: 'KECAMATAN' }
      });
      console.log(`Updated user: ${username} for District: ${district.name}`);
    }
  }

  console.log(`\nSuccessfully created/updated ${count} Kecamatan users!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
