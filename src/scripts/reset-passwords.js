const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Generating hash for default password "12345678"...');
  const defaultPassword = '12345678';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  console.log('Resetting passwords for KOLEKTOR and KECAMATAN roles...');
  
  const result = await prisma.user.updateMany({
    where: {
      role: {
        in: ['KOLEKTOR', 'KECAMATAN']
      }
    },
    data: {
      password: hashedPassword,
      isPasswordChanged: false
    }
  });

  console.log(`Successfully reset passwords for ${result.count} users.`);
}

main()
  .catch(e => {
    console.error('Error during password reset:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
