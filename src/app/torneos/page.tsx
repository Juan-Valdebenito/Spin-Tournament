import Link from "next/link";
import { listTournaments } from "@/lib/bracket";
import type { TournamentStatus } from "@/lib/types";
import TournamentCard from "@/components/TournamentCard";

const TABS: { value: TournamentStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "draft", label: "Borrador" },
  { value: "in_progress", label: "En curso" },
  { value: "completed", label: "Finalizado" },
];

export default async function TorneosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeTab: TournamentStatus | "all" =
    status === "draft" || status === "in_progress" || status === "completed" ? status : "all";

  const tournaments = await listTournaments();
  const filtered =
    activeTab === "all" ? tournaments : tournaments.filter((t) => t.status === activeTab);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Torneos</h1>
          <p className="mt-1 text-sm text-muted">
            Todos los torneos creados en la plataforma.
          </p>
        </div>
        <Link
          href="/torneos/nuevo"
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          + Nuevo torneo
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value === "all" ? "/torneos" : `/torneos?status=${tab.value}`}
            className={`label-mono rounded-md px-3 py-1.5 text-xs font-semibold uppercase transition ${
              activeTab === tab.value
                ? "bg-primary text-primary-foreground"
                : "text-muted hover:bg-surface-muted"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-muted">No hay torneos en esta categoria.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      )}
    </div>
  );
}
