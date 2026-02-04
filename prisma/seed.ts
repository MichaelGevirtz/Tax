import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Placeholder seed file
  console.log("Seed completed (no data seeded)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
