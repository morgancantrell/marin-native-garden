// Lazy Prisma client loader to avoid breaking dev if binary generation fails.
// In production, ensure Prisma is generated and DATABASE_URL is set.
let prismaInstance: any | null = null;

export async function getPrisma() {
  if (prismaInstance) return prismaInstance;
  try {
    const { PrismaClient } = await import("@prisma/client");
    prismaInstance = new PrismaClient();
    await ensureSubmissionTable();
    return prismaInstance;
  } catch (err) {
    return null;
  }
}

export async function ensureSubmissionTable() {
  try {
    if (!prismaInstance) return;
    await prismaInstance.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS Submission (
        id TEXT PRIMARY KEY,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        address TEXT NOT NULL,
        email TEXT NOT NULL,
        region TEXT NOT NULL,
        waterDistrict TEXT NOT NULL,
        plantsJson TEXT NOT NULL,
        pdfUrl TEXT
      );
    `);
  } catch {}
}


