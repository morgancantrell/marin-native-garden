import { NextRequest } from "next/server";
import { getPrisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization");
  const expected = process.env.ADMIN_TOKEN;
  if (!expected || token !== `Bearer ${expected}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const prisma = await getPrisma();
  if (!prisma) return new Response("DB unavailable", { status: 500 });

  const items = await prisma.submission.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return Response.json(items);
}


