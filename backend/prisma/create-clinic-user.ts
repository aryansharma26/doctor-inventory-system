import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function createClinicAndOwner() {
  const userUuid = process.argv[2]; // Supabase Auth User UUID
  const userEmail = process.argv[3]; // e.g. doctor@cityhospital.com
  const fullName = process.argv[4]; // e.g. Dr. Rajesh Sharma
  const clinicName = process.argv[5]; // e.g. City Health Clinic
  const clinicCode = process.argv[6] || `CLC-${Math.floor(1000 + Math.random() * 9000)}`;

  if (!userUuid || !userEmail || !fullName || !clinicName) {
    console.error(`
Usage: 
  npx tsx prisma/create-clinic-user.ts <SUPABASE_USER_UUID> <USER_EMAIL> "<FULL_NAME>" "<CLINIC_NAME>" [CLINIC_CODE]

Example:
  npx tsx prisma/create-clinic-user.ts 8a7b6c5d-1234-5678-90ab-cdef12345678 doctor@apollo.com "Dr. Amit Verma" "Apollo Clinic" APOLLO01
`);
    process.exit(1);
  }

  console.log(`Creating Clinic "${clinicName}" (${clinicCode}) for ${fullName} (${userEmail})...`);

  // 1. Create or update User
  const user = await prisma.user.upsert({
    where: { id: userUuid },
    update: {
      email: userEmail,
      fullName,
      isActive: true,
    },
    create: {
      id: userUuid,
      email: userEmail,
      fullName,
      isActive: true,
      isPlatformAdmin: false,
    },
  });

  // 2. Create Clinic
  const clinic = await prisma.clinic.create({
    data: {
      name: clinicName,
      code: clinicCode,
      email: userEmail,
      status: "ACTIVE",
      locations: {
        create: {
          name: "Main Branch",
          code: "MAIN",
          type: "CLINIC",
          isActive: true,
        },
      },
    },
  });

  // 3. Assign User to Clinic as CLINIC_OWNER
  const membership = await prisma.userClinic.create({
    data: {
      userId: user.id,
      clinicId: clinic.id,
      role: Role.CLINIC_OWNER,
      isActive: true,
    },
  });

  console.log(`
✅ SUCCESS! Clinic & Owner account created successfully!
------------------------------------------------------
Clinic Name : ${clinic.name}
Clinic Code : ${clinic.code}
Owner Name  : ${user.fullName}
Owner Email : ${user.email}
Role        : CLINIC_OWNER
------------------------------------------------------
The client can now log in at http://localhost:5173/login using their email & password!
`);
}

createClinicAndOwner()
  .catch((e) => {
    console.error("❌ Error creating clinic & user:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
