import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseCsvFile, parseWordDocument, parsePdfDocument, validateEntries } from "@/lib/calendar/parser";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name;
    const fileType = fileName.split(".").pop()?.toLowerCase() || "";

    let result: { entries: any[]; errors: string[] };

    switch (fileType) {
      case "csv":
        result = await parseCsvFile(fileBuffer);
        break;
      case "doc":
      case "docx":
        result = await parseWordDocument(fileBuffer);
        break;
      case "pdf":
        result = await parsePdfDocument(fileBuffer);
        break;
      default:
        return NextResponse.json({ error: "Unsupported file format. Please upload CSV, DOCX, or PDF." }, { status: 400 });
    }

    if (result.errors.length > 0 && result.entries.length === 0) {
      return NextResponse.json({ error: "Failed to parse file", details: result.errors }, { status: 400 });
    }

    const validation = await validateEntries(result.entries);

    const calendar = await prisma.contentCalendar.create({
      data: {
        userId: session.user.id,
        fileName,
        fileType,
        status: "ready",
        totalEntries: result.entries.length,
      },
    });

    for (const entry of result.entries) {
      await prisma.contentEntry.create({
        data: {
          calendarId: calendar.id,
          userId: session.user.id,
          targetDate: new Date(entry.date),
          topicOrTitle: entry.topic_or_title,
          blogUrl: entry.blog_url,
          boardName: entry.board_name,
          contentCategory: entry.content_category || null,
          extraNotes: entry.extra_notes || null,
          preferredStyle: entry.preferred_style || null,
          brandColorsOverride: entry.brand_colors || null,
          pinsPerDayOverride: entry.pins_per_day || null,
          userImageUrl: entry.image_upload_path || null,
          status: "pending",
        },
      });
    }

    return NextResponse.json({
      calendarId: calendar.id,
      entries: result.entries,
      totalEntries: result.entries.length,
      errors: result.errors,
      validation,
    });
  } catch (error: any) {
    console.error("Calendar upload failed:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
