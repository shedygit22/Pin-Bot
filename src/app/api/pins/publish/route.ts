import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/utils/encryption";
import { createPinterestPin, refreshAccessToken } from "@/lib/pinterest/api";
import { encrypt } from "@/lib/utils/encryption";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let pinId: string | undefined;
  try {
    const body = await req.json();
    pinId = body.pinId;
    if (!pinId) {
      return NextResponse.json({ error: "pinId required" }, { status: 400 });
    }

    const pin = await prisma.scheduledPin.findUnique({
      where: { id: pinId, userId: session.user.id },
    });

    if (!pin) {
      return NextResponse.json({ error: "Pin not found" }, { status: 404 });
    }

    if (pin.status === "published") {
      return NextResponse.json({ error: "Pin already published" }, { status: 400 });
    }

    const account = await prisma.pinterestAccount.findUnique({
      where: { userId: session.user.id },
    });

    if (!account) {
      return NextResponse.json({ error: "Pinterest not connected" }, { status: 400 });
    }

    let accessToken: string;
    try {
      accessToken = decrypt(account.accessToken);
    } catch {
      return NextResponse.json({ error: "Token decryption failed" }, { status: 500 });
    }

    if (account.tokenExpiresAt && new Date() > account.tokenExpiresAt) {
      if (account.refreshToken) {
        try {
          const refreshToken = decrypt(account.refreshToken);
          const tokens = await refreshAccessToken(refreshToken);
          accessToken = tokens.accessToken;

          await prisma.pinterestAccount.update({
            where: { id: account.id },
            data: {
              accessToken: encrypt(tokens.accessToken),
              refreshToken: encrypt(tokens.refreshToken),
              tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
              lastRefreshedAt: new Date(),
            },
          });
        } catch {
          return NextResponse.json({ error: "Token refresh failed. Please reconnect Pinterest." }, { status: 401 });
        }
      } else {
        return NextResponse.json({ error: "Token expired and no refresh token available" }, { status: 401 });
      }
    }

    const description = [
      pin.generatedDescription,
      pin.generatedHashtags,
    ].filter(Boolean).join("\n\n");

    const pinterestPin = await createPinterestPin(accessToken, {
      boardId: pin.boardId!,
      title: pin.generatedTitle!,
      description,
      link: pin.blogUrlWithUtm!,
      imageUrl: pin.imageUrl!,
      altText: pin.generatedAltText || undefined,
    });

    await prisma.$transaction([
      prisma.scheduledPin.update({
        where: { id: pin.id },
        data: {
          status: "published",
          pinterestPinId: pinterestPin.id,
          pinterestPinUrl: `https://www.pinterest.com/pin/${pinterestPin.id}/`,
          publishedAt: new Date(),
        },
      }),
      prisma.jobLog.create({
        data: {
          pinId: pin.id,
          jobType: "publish_pin",
          status: "success",
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      pinId: pin.id,
      pinterestPinId: pinterestPin.id,
      pinterestPinUrl: `https://www.pinterest.com/pin/${pinterestPin.id}/`,
    });
  } catch (error: any) {
    if (pinId) {
      await prisma.scheduledPin.update({
        where: { id: pinId },
        data: { retryCount: { increment: 1 }, lastRetryAt: new Date() },
      });
    }
    return NextResponse.json({ error: error.message || "Publish failed" }, { status: 500 });
  }
}
