import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/utils/encryption";
import { getPinterestBoards } from "@/lib/pinterest/api";
import axios from "axios";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/settings?error=no_code", req.url));
  }

  try {
    const tokenResponse = await axios.post(
      "https://api.pinterest.com/v5/oauth/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.PINTEREST_REDIRECT_URI!,
        client_id: process.env.PINTEREST_CLIENT_ID!,
        client_secret: process.env.PINTEREST_CLIENT_SECRET!,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    const encryptedAccess = encrypt(access_token);
    const encryptedRefresh = refresh_token ? encrypt(refresh_token) : null;

    const boards = await getPinterestBoards(access_token);

    await prisma.pinterestAccount.upsert({
      where: { userId: session.user.id },
      update: {
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
        boardsJson: JSON.stringify(boards),
        lastRefreshedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
        boardsJson: JSON.stringify(boards),
      },
    });

    return NextResponse.redirect(new URL("/settings?pinterest=connected", req.url));
  } catch (error: any) {
    console.error("Pinterest OAuth callback failed:", error?.response?.data || error);
    return NextResponse.redirect(new URL("/settings?error=auth_failed", req.url));
  }
}
