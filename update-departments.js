const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateUserDepartments() {
  try {
    console.log('Updating user departments...');

    // Get all users
    const users = await prisma.user.findMany();
    console.log('Found users:', users.length);

    // Define departments
    const departments = [
      'นโยบายและวิชาการ',
      'การพัฒนาสังคมและสวัสดิการ', 
      'บริหารงานทั่วไป',
      'ศูนย์บริการคนพิการ'
    ];

    // Update each user with a random department
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const department = departments[i % departments.length];
      
      await prisma.user.update({
        where: { id: user.id },
        data: { department: department }
      });
      
      console.log(`Updated user ${user.email} -> ${department}`);
    }

    console.log('✅ All users updated with departments!');
    
  } catch (error) {
    console.error('Error updating departments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserDepartments();