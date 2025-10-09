const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Checking users in database...');
    
    const users = await prisma.user.findMany();
    console.log('Users found:', users.length);
    
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Name: ${user.name}, Role: ${user.role}`);
    });
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();