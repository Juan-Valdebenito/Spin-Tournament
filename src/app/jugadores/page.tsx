import Link from "next/link";
import { Users } from "lucide-react";
import { listPlayers } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function JugadoresPage() {
  const players = await listPlayers();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Jugadores</h1>
        <p className="mt-1 text-sm text-muted">
          Estadisticas acumuladas de todos los participantes, a traves de todos los torneos.
        </p>
      </div>

      {players.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-muted">Todavia no hay jugadores cargados.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="label-mono border-b border-border text-left text-xs uppercase text-muted">
                <th className="px-4 py-3 font-semibold">Jugador</th>
                <th className="px-4 py-3 font-semibold">Torneos</th>
                <th className="px-4 py-3 font-semibold">Partidos</th>
                <th className="px-4 py-3 font-semibold">Ganados</th>
                <th className="px-4 py-3 font-semibold">Perdidos</th>
                <th className="px-4 py-3 font-semibold">% Victorias</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.name} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/jugadores/${encodeURIComponent(p.name)}`}
                      className="flex items-center gap-2 font-medium hover:text-primary"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Users size={14} />
                      </span>
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.tournaments}</td>
                  <td className="px-4 py-3 text-muted">{p.matchesPlayed}</td>
                  <td className="px-4 py-3 text-success font-medium">{p.wins}</td>
                  <td className="px-4 py-3 text-muted">{p.losses}</td>
                  <td className="px-4 py-3 font-medium">
                    {p.matchesPlayed > 0 ? `${p.winRate}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
