import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "month";

  const now = new Date();
  let startDate: Date;

  switch (period) {
    case "week":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const [publishedPins, scheduledPins, analytics, calendars, totalPins] = await Promise.all([
    prisma.scheduledPin.findMany({
      where: { userId: session.user.id, status: "published", publishedAt: { gte: startDate } },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.scheduledPin.findMany({
      where: { userId: session.user.id, status: "pending", scheduledAt: { gte: now } },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.pinAnalytics.findMany({
      where: { pin: { userId: session.user.id }, fetchedAt: { gte: startDate } },
    }),
    prisma.contentCalendar.findMany({
      where: { userId: session.user.id },
      orderBy: { uploadedAt: "desc" },
      take: 5,
    }),
    prisma.scheduledPin.count({
      where: { userId: session.user.id },
    }),
  ]);

  const successCount = publishedPins.length;
  const failedCount = await prisma.jobLog.count({
    where: { status: "failed" },
  });

  const impressions = analytics.reduce((sum, a) => sum + a.impressions, 0);
  const saves = analytics.reduce((sum, a) => sum + a.saves, 0);
  const clicks = analytics.reduce((sum, a) => sum + a.clicks, 0);

  const categoryDistribution: Record<string, number> = {};
  publishedPins.forEach((pin) => {
    const cat = pin.boardName || "Uncategorized";
    categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;
  });

  const dailyPins: Record<string, number> = {};
  publishedPins.forEach((pin) => {
    if (pin.publishedAt) {
      const day = pin.publishedAt.toISOString().split("T")[0];
      dailyPins[day] = (dailyPins[day] || 0) + 1;
    }
  });

  const imageSourceBreakdown: Record<string, number> = {};
  publishedPins.forEach((pin) => {
    const source = pin.imageSource || "unknown";
    imageSourceBreakdown[source] = (imageSourceBreakdown[source] || 0) + 1;
  });

  const topPins = publishedPins
    .map((pin) => ({
      id: pin.id,
      title: pin.generatedTitle,
      imageUrl: pin.imageUrl,
      pinterestPinUrl: pin.pinterestPinUrl,
      analytics: analytics.filter((a) => a.pinId === pin.id),
    }))
    .sort((a, b) => {
      const aSaves = a.analytics.reduce((s, an) => s + an.saves, 0);
      const bSaves = b.analytics.reduce((s, an) => s + an.saves, 0);
      return bSaves - aSaves;
    })
    .slice(0, 10);

  return NextResponse.json({
    period,
    summary: {
      totalPins,
      published: successCount,
      scheduled: scheduledPins.length,
      failed: failedCount,
      impressions,
      saves,
      clicks,
      engagementRate: impressions > 0 ? ((saves + clicks) / impressions) * 100 : 0,
    },
    topPins,
    categoryDistribution,
    dailyPins,
    imageSourceBreakdown,
    upcomingPins: scheduledPins.slice(0, 10),
    recentCalendars: calendars,
    nextPin: scheduledPins[0] || null,
  });
}
