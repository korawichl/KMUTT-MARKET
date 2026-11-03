import { NextRequest, NextResponse } from "next/server";
import { readDatabase, writeDatabase } from "@/lib/db-server";
import { DatabaseState } from "@/types/database";
import { INITIAL_DATABASE_STATE } from "@/lib/initial-data";

export async function GET() {
  const data = readDatabase();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body?.action === "RESET_DEMO_DATA") {
      const reset = writeDatabase(INITIAL_DATABASE_STATE);
      return NextResponse.json({ ok: true, data: reset });
    }
    if (body?.state) {
      const updated = writeDatabase(body.state as DatabaseState);
      return NextResponse.json({ ok: true, data: updated });
    }
    return NextResponse.json(
      { ok: false, error: "Invalid request payload" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}
