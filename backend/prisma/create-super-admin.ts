import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createSuperAdmin() {
  const userId = process.argv[2];
  const email = process.argv[3];
  const fullName = process.argv[4] || "Super Admin";

  if (!userId || !email) {
    console.error("Usage: npx tsx prisma/create-super-admin.ts <USER_UUID> <EMAIL> [FULL_NAME]");
    process.exit(1);
  }

  console.log(`Creating Super Admin with ID: ${userId}, Email: ${email}...`);

  const user = await prisma.user.upsert({
    where: { id: userId },
    update: {
      isPlatformAdmin: true,
      isActive: true,
      email,
      fullName,
    },
    create: {
      id: userId,
      email,
      fullName,
      isPlatformAdmin: true,
      isActive: true,
    },
  });

  console.log("✅ Super Admin created successfully!");
  console.log(user);
}

createSuperAdmin()
  .catch((e) => {
    console.error("❌ Error creating Super Admin:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
