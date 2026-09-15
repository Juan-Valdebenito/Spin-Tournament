import Link from "next/link";
import { Trophy } from "lucide-react";
import StatusPill from "@/components/StatusPill";
import type { Tournament } from "@/lib/types";

export default function TournamentCard({ tournament }: { tournament: Tournament }) {
  return (
    <Link
      href={`/torneos/${tournament.id}`}
      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4 transition hover:border-primary"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Trophy size={18} />
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold">{tournament.name}</p>
          <p className="text-xs text-muted">
            {new Date(tournament.created_at).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
      <StatusPill status={tournament.status} />
    </Link>
  );
}
