import { NextRequest, NextResponse } from "next/server";
import { createTournament, listTournaments } from "@/lib/bracket";

export async function GET() {
  return NextResponse.json({ tournaments: await listTournaments() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "");
    const participantNames = Array.isArray(body.participantNames)
      ? body.participantNames.map((n: unknown) => String(n))
      : [];
    const tournament = await createTournament(name, participantNames);
    return NextResponse.json({ tournament }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error inesperado";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
