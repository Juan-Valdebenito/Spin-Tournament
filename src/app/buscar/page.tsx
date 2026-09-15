import Link from "next/link";
import { Users } from "lucide-react";
import { searchAll } from "@/lib/stats";
import TournamentCard from "@/components/TournamentCard";

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query ? await searchAll(query) : { tournaments: [], players: [] };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Resultados de busqueda</h1>
        {query ? (
          <p className="mt-1 text-sm text-muted">
            Mostrando resultados para <span className="font-medium">&ldquo;{query}&rdquo;</span>
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted">Escribi algo en el buscador para empezar.</p>
        )}
      </div>

      {query && results.tournaments.length === 0 && results.players.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-muted">No se encontraron torneos ni jugadores.</p>
        </div>
      )}

      {results.tournaments.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted">Torneos</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {results.tournaments.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        </div>
      )}

      {results.players.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted">Jugadores</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {results.players.map((name) => (
              <Link
                key={name}
                href={`/jugadores/${encodeURIComponent(name)}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 hover:border-primary"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Users size={16} />
                </span>
                <span className="font-medium">{name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
