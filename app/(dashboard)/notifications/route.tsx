// app/api/notifications/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: [],
    unreadCount: 0,
  });
}
