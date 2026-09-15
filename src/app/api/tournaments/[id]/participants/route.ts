import { NextRequest, NextResponse } from "next/server";
import { replaceParticipants } from "@/lib/bracket";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await req.json();
    const names = Array.isArray(body.names) ? body.names.map((n: unknown) => String(n)) : [];
    await replaceParticipants(id, names);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error inesperado";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
