const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Menyetel ulang password untuk Kolektor dan Kecamatan...');
  
  const hash = await bcrypt.hash('12345678', 10);
  
  const result = await prisma.user.updateMany({
    where: { 
      role: {
        in: ['KOLEKTOR', 'VERIFIKATOR']
      }
    },
    data: { password: hash }
  });
  
  console.log(`Berhasil menyetel ulang password untuk ${result.count} akun (Kolektor & Kecamatan).`);
}

main()
  .catch(console.error)
  .finally(async () => await prisma.$disconnect());
