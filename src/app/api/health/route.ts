import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {} as Record<string, string>,
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = "ok";
  } catch {
    health.checks.database = "error";
    health.status = "degraded";
  }

  try {
    const queueDepth = await prisma.scheduledPin.count({
      where: { status: "pending", scheduledAt: { lte: new Date() } },
    });
    health.checks.queueDepth = String(queueDepth);
  } catch {
    health.checks.queueDepth = "unknown";
  }

  const lastPublished = await prisma.scheduledPin.findFirst({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
  });
  health.checks.lastPublished = lastPublished?.publishedAt?.toISOString() || "never";

  return NextResponse.json(health);
}
