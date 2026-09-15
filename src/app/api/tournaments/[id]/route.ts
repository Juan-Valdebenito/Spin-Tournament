import { NextResponse } from "next/server";
import { deleteTournament, getTournamentDetail } from "@/lib/bracket";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const detail = await getTournamentDetail(id);
  if (!detail) return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });
  return NextResponse.json(detail);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    await deleteTournament(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error inesperado";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
