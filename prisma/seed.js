const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('V3rx!2kpZ@9u', 10);
  
  const defaultOwner = await prisma.user.upsert({
    where: { email: 'esteky@gmail.com' },
    update: {},
    create: {
      email: 'esteky@gmail.com',
      password: hashedPassword,
      role: 'Owner',
    },
  });

  console.log('Default owner created:', defaultOwner);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 