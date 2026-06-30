const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function testLogin() {
  try {
    const username = 'verifikator';
    const password = 'admin123';
    
    console.log(`Finding user ${username}...`);
    const user = await prisma.user.findUnique({
      where: { username }
    });
    console.log('User found:', user ? 'yes' : 'no');
    
    if (!user) return console.log('Invalid credentials');
    
    console.log('Comparing passwords...');
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', passwordMatch);
    
    if (!passwordMatch) return console.log('Invalid credentials');

    console.log('Login successful');
  } catch (e) {
    console.error('General error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
