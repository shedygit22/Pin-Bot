import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePinContent } from "@/lib/ai/generator";
import { generatePinImage } from "@/lib/images/generator";
import { uploadToCloudinary } from "@/lib/utils/cloudinary";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pinId, element } = await req.json();
  if (!pinId || !element) {
    return NextResponse.json({ error: "pinId and element required" }, { status: 400 });
  }

  const pin = await prisma.scheduledPin.findUnique({
    where: { id: pinId, userId: session.user.id },
    include: { entry: true },
  });

  if (!pin) {
    return NextResponse.json({ error: "Pin not found" }, { status: 404 });
  }

  const brandSettings = await prisma.brandSettings.findUnique({
    where: { userId: session.user.id },
  });

  const brandColors = brandSettings?.brandColorsJson
    ? JSON.parse(brandSettings.brandColorsJson)
    : ["#667eea", "#764ba2"];

  const updateData: any = {};

  if (element === "all" || element === "title") {
    const content = await generatePinContent({
      topicOrTitle: pin.entry.topicOrTitle,
      blogUrl: pin.entry.blogUrl,
      contentCategory: pin.entry.contentCategory || undefined,
      brandVoice: brandSettings?.brandVoice || "professional",
      brandColors,
      extraNotes: pin.entry.extraNotes || undefined,
      preferredStyle: pin.entry.preferredStyle || undefined,
    });
    updateData.generatedTitle = content.title;
    updateData.generatedKeywords = content.keywords.join(", ");
  }

  if (element === "all" || element === "description") {
    const content = await generatePinContent({
      topicOrTitle: pin.entry.topicOrTitle,
      blogUrl: pin.entry.blogUrl,
      contentCategory: pin.entry.contentCategory || undefined,
      brandVoice: brandSettings?.brandVoice || "professional",
      brandColors,
      extraNotes: pin.entry.extraNotes || undefined,
      preferredStyle: pin.entry.preferredStyle || undefined,
    });
    updateData.generatedDescription = content.description;
    updateData.generatedHashtags = content.hashtags.join(" ");
    updateData.generatedCta = content.cta;
    updateData.generatedAltText = content.altText;
  }

  if (element === "all" || element === "image") {
    const content = await generatePinContent({
      topicOrTitle: pin.entry.topicOrTitle,
      blogUrl: pin.entry.blogUrl,
      contentCategory: pin.entry.contentCategory || undefined,
      brandVoice: brandSettings?.brandVoice || "professional",
      brandColors,
      extraNotes: pin.entry.extraNotes || undefined,
      preferredStyle: pin.entry.preferredStyle || undefined,
    });

    const { buffer, source } = await generatePinImage({
      prompt: content.imagePrompt,
      title: content.title,
      brandColors,
    });

    const imageUrl = await uploadToCloudinary(buffer, "pinterest-pins");
    updateData.imageUrl = imageUrl || "";
    updateData.imageSource = source;
    updateData.imagePromptUsed = content.imagePrompt;
  }

  await prisma.scheduledPin.update({
    where: { id: pinId },
    data: updateData,
  });

  return NextResponse.json({ success: true, updated: Object.keys(updateData) });
}
