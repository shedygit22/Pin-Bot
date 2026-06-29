import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const status = searchParams.get("status");

  const where: any = { userId: session.user.id };

  if (startDate && endDate) {
    where.scheduledAt = { gte: new Date(startDate), lte: new Date(endDate) };
  }

  if (status) where.status = status;

  const pins = await prisma.scheduledPin.findMany({
    where,
    orderBy: { scheduledAt: "asc" },
    include: {
      entry: { select: { topicOrTitle: true, blogUrl: true, boardName: true, contentCategory: true } },
      analytics: { orderBy: { fetchedAt: "desc" }, take: 1 },
    },
  });

  return NextResponse.json({ pins });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pinId, scheduledAt, boardId, status } = await req.json();

  const updateData: any = {};
  if (scheduledAt) updateData.scheduledAt = new Date(scheduledAt);
  if (boardId) updateData.boardId = boardId;
  if (status) updateData.status = status;

  const pin = await prisma.scheduledPin.update({
    where: { id: pinId, userId: session.user.id },
    data: updateData,
  });

  return NextResponse.json({ pin });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pinIds } = await req.json();

  await prisma.scheduledPin.deleteMany({
    where: { id: { in: pinIds }, userId: session.user.id },
  });

  return NextResponse.json({ deleted: pinIds.length });
}
