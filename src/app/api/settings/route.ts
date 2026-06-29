import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user, brandSettings, pinterestAccount] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.brandSettings.findUnique({ where: { userId: session.user.id } }),
    prisma.pinterestAccount.findUnique({ where: { userId: session.user.id } }),
  ]);

  return NextResponse.json({
    user: {
      id: user?.id,
      email: user?.email,
      name: user?.name,
      timezone: user?.timezone,
      onboardingComplete: user?.onboardingComplete,
    },
    brand: brandSettings ? {
      brandName: brandSettings.brandName,
      nicheDescription: brandSettings.nicheDescription,
      brandVoice: brandSettings.brandVoice,
      brandColors: JSON.parse(brandSettings.brandColorsJson || "[]"),
      logoUrl: brandSettings.logoUrl,
      watermarkUrl: brandSettings.watermarkUrl,
      fontPreference: brandSettings.fontPreference,
      defaultPinsPerDay: brandSettings.defaultPinsPerDay,
      autoFillEnabled: brandSettings.autoFillEnabled,
      blackoutDates: JSON.parse(brandSettings.blackoutDatesJson || "[]"),
      imageStylePreferences: JSON.parse(brandSettings.imageStylePreferencesJson || "{}"),
    } : null,
    pinterest: pinterestAccount ? {
      connected: true,
      username: pinterestAccount.username,
      boards: JSON.parse(pinterestAccount.boardsJson || "[]"),
    } : { connected: false },
  });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { brand, user: userData } = body;

  if (userData) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: userData.name,
        timezone: userData.timezone,
        onboardingComplete: userData.onboardingComplete,
      },
    });
  }

  if (brand) {
    const settings: any = {};
    if (brand.brandName !== undefined) settings.brandName = brand.brandName;
    if (brand.nicheDescription !== undefined) settings.nicheDescription = brand.nicheDescription;
    if (brand.brandVoice !== undefined) settings.brandVoice = brand.brandVoice;
    if (brand.brandColors !== undefined) settings.brandColorsJson = JSON.stringify(brand.brandColors);
    if (brand.logoUrl !== undefined) settings.logoUrl = brand.logoUrl;
    if (brand.watermarkUrl !== undefined) settings.watermarkUrl = brand.watermarkUrl;
    if (brand.fontPreference !== undefined) settings.fontPreference = brand.fontPreference;
    if (brand.defaultPinsPerDay !== undefined) settings.defaultPinsPerDay = brand.defaultPinsPerDay;
    if (brand.autoFillEnabled !== undefined) settings.autoFillEnabled = brand.autoFillEnabled;
    if (brand.blackoutDates !== undefined) settings.blackoutDatesJson = JSON.stringify(brand.blackoutDates);
    if (brand.imageStylePreferences !== undefined) settings.imageStylePreferencesJson = JSON.stringify(brand.imageStylePreferences);

    await prisma.brandSettings.upsert({
      where: { userId: session.user.id },
      update: settings,
      create: { userId: session.user.id, ...settings },
    });
  }

  return NextResponse.json({ success: true });
}
