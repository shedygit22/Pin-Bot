import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/utils/encryption";
import { getPinterestBoards, refreshAccessToken } from "@/lib/pinterest/api";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await prisma.pinterestAccount.findUnique({
    where: { userId: session.user.id },
  });

  if (!account) {
    return NextResponse.json({ error: "Pinterest not connected" }, { status: 400 });
  }

  try {
    const accessToken = decrypt(account.accessToken);
    const boards = await getPinterestBoards(accessToken);

    await prisma.pinterestAccount.update({
      where: { id: account.id },
      data: { boardsJson: JSON.stringify(boards) },
    });

    return NextResponse.json({ boards });
  } catch (error) {
    if (account.refreshToken) {
      try {
        const refreshToken = decrypt(account.refreshToken);
        const tokens = await refreshAccessToken(refreshToken);

        const encryptedAccess = encrypt(tokens.accessToken);
        const encryptedRefresh = tokens.refreshToken ? encrypt(tokens.refreshToken) : null;

        await prisma.pinterestAccount.update({
          where: { id: account.id },
          data: {
            accessToken: encryptedAccess,
            refreshToken: encryptedRefresh,
            tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
            lastRefreshedAt: new Date(),
          },
        });

        const boards = await getPinterestBoards(tokens.accessToken);
        await prisma.pinterestAccount.update({
          where: { id: account.id },
          data: { boardsJson: JSON.stringify(boards) },
        });

        return NextResponse.json({ boards });
      } catch (refreshError) {
        return NextResponse.json({ error: "Token refresh failed" }, { status: 401 });
      }
    }
    return NextResponse.json({ error: "Failed to fetch boards" }, { status: 500 });
  }
}
