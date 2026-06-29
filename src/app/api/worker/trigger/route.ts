import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/health`
    );
    const health = await response.json();

    return NextResponse.json({
      triggered: true,
      health,
      note: "The background worker runs independently. This endpoint triggers health checks.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
