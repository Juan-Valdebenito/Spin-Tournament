import Link from "next/link";
import { Activity, CheckCircle2, Swords, Users } from "lucide-react";
import { getDashboardStats, listRecentTournaments } from "@/lib/stats";
import StatCard from "@/components/StatCard";
import TournamentCard from "@/components/TournamentCard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, recent] = await Promise.all([getDashboardStats(), listRecentTournaments(6)]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Panel general</h1>
          <p className="mt-1 text-sm text-muted">
            Estadisticas globales y torneos de tenis de mesa.
          </p>
        </div>
        <Link
          href="/torneos/nuevo"
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          + Nuevo torneo
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Torneos activos"
          value={stats.activeTournaments}
          icon={Activity}
          accent="success"
        />
        <StatCard
          label="Torneos finalizados"
          value={stats.completedTournaments}
          icon={CheckCircle2}
          accent="primary"
        />
        <StatCard label="Jugadores registrados" value={stats.totalPlayers} icon={Users} />
        <StatCard
          label="Partidos jugados"
          value={stats.matchesPlayed}
          icon={Swords}
          accent="accent"
        />
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Torneos recientes</h2>
          <Link href="/torneos" className="text-sm font-medium text-primary hover:underline">
            Ver todos
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-10 text-center">
            <p className="text-muted">Todavia no hay torneos creados.</p>
            <Link
              href="/torneos/nuevo"
              className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Crear el primer torneo
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {recent.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
