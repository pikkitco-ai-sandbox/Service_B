import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "service-b",
    version: "1.0.0",
    chat_backend_mode: process.env.CHAT_BACKEND_MODE || "mock",
  });
}
