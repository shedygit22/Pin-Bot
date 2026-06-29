import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPinterestAuthUrl } from "@/lib/pinterest/oauth";
import { nanoid } from "nanoid";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = nanoid();
  const authUrl = getPinterestAuthUrl(state);

  return NextResponse.json({ url: authUrl, state });
}
