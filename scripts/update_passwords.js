const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('12345678', 10);
  
  const result = await prisma.user.updateMany({
    where: { 
      role: 'KOLEKTOR',
      isPasswordChanged: false
    },
    data: {
      password: hashedPassword
    }
  });

  console.log(`Updated ${result.count} KOLEKTOR accounts to the new default password '12345678'.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
