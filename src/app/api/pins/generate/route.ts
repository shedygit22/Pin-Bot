import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePinContent, generatePinVariations } from "@/lib/ai/generator";
import { generatePinImage } from "@/lib/images/generator";
import { uploadToCloudinary } from "@/lib/utils/cloudinary";
import { generateScheduleSlots } from "@/lib/calendar/scheduler";
import { buildUtmUrl } from "@/lib/pinterest/api";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { entryIds, calendarId } = await req.json();

    const entries = await prisma.contentEntry.findMany({
      where: {
        id: { in: entryIds || [] },
        ...(calendarId ? { calendarId } : {}),
        userId: session.user.id,
      },
    });

    if (entries.length === 0) {
      return NextResponse.json({ error: "No entries found" }, { status: 404 });
    }

    const brandSettings = await prisma.brandSettings.findUnique({
      where: { userId: session.user.id },
    });

    const brandColors = brandSettings?.brandColorsJson
      ? JSON.parse(brandSettings.brandColorsJson)
      : ["#667eea", "#764ba2"];

    const brandVoice = brandSettings?.brandVoice || "professional";

    const pinterestAccount = await prisma.pinterestAccount.findUnique({
      where: { userId: session.user.id },
    });

    const boards = pinterestAccount?.boardsJson
      ? JSON.parse(pinterestAccount.boardsJson)
      : [];

    const results: Array<{ entryId: string; pins: any[]; errors: string[] }> = [];

    for (const entry of entries) {
      try {
        const pinsPerDay = entry.pinsPerDayOverride || brandSettings?.defaultPinsPerDay || 4;
        const boardNames = [entry.boardName, ...boards.map((b: any) => b.name || b.id).filter((n: string) => n !== entry.boardName)];

        const slots = generateScheduleSlots(entry.targetDate, pinsPerDay, boardNames);

        if (slots.length === 1) {
          const content = await generatePinContent({
            topicOrTitle: entry.topicOrTitle,
            blogUrl: entry.blogUrl,
            contentCategory: entry.contentCategory || undefined,
            brandVoice,
            brandColors,
            extraNotes: entry.extraNotes || undefined,
            preferredStyle: entry.preferredStyle || undefined,
          });

          const { buffer: imageBuffer, source } = await generatePinImage({
            prompt: content.imagePrompt,
            title: content.title,
            brandColors,
            userImageUrl: entry.userImageUrl || undefined,
          });

          const imageUrl = await uploadToCloudinary(imageBuffer, "pinterest-pins");

          const utmUrl = buildUtmUrl(
            entry.blogUrl,
            `pinbot-${entry.targetDate.getMonth() + 1}-${entry.targetDate.getFullYear()}`,
            content.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").substring(0, 50)
          );

          const pin = await prisma.scheduledPin.create({
            data: {
              entryId: entry.id,
              userId: session.user.id,
              boardId: boards.find((b: any) => b.name === entry.boardName)?.id || "",
              boardName: entry.boardName,
              generatedTitle: content.title,
              generatedDescription: content.description,
              generatedKeywords: content.keywords.join(", "),
              generatedHashtags: content.hashtags.join(" "),
              generatedAltText: content.altText,
              generatedCta: content.cta,
              imageUrl: imageUrl || "",
              imageSource: source,
              imagePromptUsed: content.imagePrompt,
              blogUrlWithUtm: utmUrl,
              scheduledAt: slots[0].datetime,
              status: "pending",
            },
          });

          results.push({ entryId: entry.id, pins: [pin], errors: [] });
        } else {
          const variations = await generatePinVariations(
            {
              topicOrTitle: entry.topicOrTitle,
              blogUrl: entry.blogUrl,
              contentCategory: entry.contentCategory || undefined,
              brandVoice,
              brandColors,
              extraNotes: entry.extraNotes || undefined,
              preferredStyle: entry.preferredStyle || undefined,
            },
            slots.length
          );

          const pins = [];
          for (let i = 0; i < Math.min(variations.length, slots.length); i++) {
            const v = variations[i];
            const slot = slots[i];

            const { buffer: imageBuffer, source } = await generatePinImage({
              prompt: v.imagePrompt,
              title: v.title,
              brandColors,
              userImageUrl: entry.userImageUrl || undefined,
            });

            const imageUrl = await uploadToCloudinary(imageBuffer, "pinterest-pins");

            const boardName = boardNames[slot.boardIndex] || entry.boardName;
            const boardId = boards.find((b: any) => b.name === boardName)?.id || "";

            const utmUrl = buildUtmUrl(
              entry.blogUrl,
              `pinbot-${entry.targetDate.getMonth() + 1}-${entry.targetDate.getFullYear()}`,
              v.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").substring(0, 50)
            );

            const pin = await prisma.scheduledPin.create({
              data: {
                entryId: entry.id,
                userId: session.user.id,
                boardId,
                boardName,
                generatedTitle: v.title,
                generatedDescription: v.description,
                generatedKeywords: v.keywords.join(", "),
                generatedHashtags: v.hashtags.join(" "),
                generatedAltText: v.altText,
                generatedCta: v.cta,
                imageUrl: imageUrl || "",
                imageSource: source,
                imagePromptUsed: v.imagePrompt,
                blogUrlWithUtm: utmUrl,
                scheduledAt: slot.datetime,
                status: "pending",
              },
            });
            pins.push(pin);
          }
          results.push({ entryId: entry.id, pins, errors: [] });
        }
      } catch (entryError: any) {
        results.push({ entryId: entry.id, pins: [], errors: [entryError.message] });
      }
    }

    await prisma.contentCalendar.updateMany({
      where: { userId: session.user.id, status: "ready" },
      data: { status: "active" },
    });

    return NextResponse.json({ results, totalGenerated: results.reduce((a, r) => a + r.pins.length, 0) });
  } catch (error: any) {
    console.error("Content generation failed:", error);
    return NextResponse.json({ error: error.message || "Generation failed" }, { status: 500 });
  }
}
