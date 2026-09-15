import Link from "next/link";
import { notFound } from "next/navigation";
import { Swords, Trophy, Users } from "lucide-react";
import { getPlayerDetail } from "@/lib/stats";

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const detail = await getPlayerDetail(decodeURIComponent(name));
  if (!detail) notFound();

  const { summary, matches } = detail;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 rounded-lg border border-border bg-surface p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Users size={26} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{summary.name}</h1>
          <p className="text-sm text-muted">
            {summary.tournaments} torneo{summary.tournaments === 1 ? "" : "s"} jugado
            {summary.tournaments === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="label-mono text-xs font-semibold uppercase text-muted">Partidos</p>
          <p className="mt-2 text-2xl font-bold">{summary.matchesPlayed}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="label-mono text-xs font-semibold uppercase text-muted">Ganados</p>
          <p className="mt-2 text-2xl font-bold text-success">{summary.wins}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="label-mono text-xs font-semibold uppercase text-muted">Perdidos</p>
          <p className="mt-2 text-2xl font-bold">{summary.losses}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="label-mono text-xs font-semibold uppercase text-muted">% Victorias</p>
          <p className="mt-2 text-2xl font-bold text-primary">
            {summary.matchesPlayed > 0 ? `${summary.winRate}%` : "—"}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="mb-4 flex items-center gap-2">
          <Swords size={16} className="text-muted" />
          <h2 className="text-base font-semibold">Historial de partidos</h2>
        </div>

        {matches.length === 0 ? (
          <p className="text-sm text-muted">Todavia no jugo ningun partido con resultado cargado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="label-mono border-b border-border text-left text-xs uppercase text-muted">
                  <th className="px-3 py-2 font-semibold">Torneo</th>
                  <th className="px-3 py-2 font-semibold">Rival</th>
                  <th className="px-3 py-2 font-semibold">Resultado</th>
                  <th className="px-3 py-2 font-semibold">Marcador</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/torneos/${m.tournamentId}`}
                        className="flex items-center gap-1.5 hover:text-primary"
                      >
                        <Trophy size={13} className="text-muted" />
                        {m.tournamentName}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-muted">{m.opponentName}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`label-mono rounded px-2 py-0.5 text-[11px] font-semibold uppercase ${
                          m.won ? "bg-success-soft text-success" : "bg-accent-soft text-accent"
                        }`}
                      >
                        {m.won ? "Gano" : "Perdio"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-medium">
                      {m.ownScore} - {m.opponentScore}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
