import { NextRequest, NextResponse } from "next/server";
import { submitMatchResult } from "@/lib/bracket";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await req.json();
    const score1 = Number(body.score1);
    const score2 = Number(body.score2);
    await submitMatchResult(id, score1, score2);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error inesperado";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
