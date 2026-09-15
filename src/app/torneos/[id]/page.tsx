import { notFound } from "next/navigation";
import { getTournamentDetail } from "@/lib/bracket";
import StatusPill from "@/components/StatusPill";
import TournamentDraftPanel from "@/components/TournamentDraftPanel";
import DeleteTournamentButton from "@/components/DeleteTournamentButton";
import Bracket from "@/components/Bracket";

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getTournamentDetail(id);
  if (!detail) notFound();

  const { tournament, participants, rounds, champion } = detail;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{tournament.name}</h1>
            <StatusPill status={tournament.status} />
          </div>
          <p className="mt-1 text-sm text-muted">
            Creado el {new Date(tournament.created_at).toLocaleDateString("es-ES")} ·{" "}
            {participants.length} participantes
          </p>
        </div>
        <DeleteTournamentButton tournamentId={tournament.id} />
      </div>

      {tournament.status === "draft" ? (
        <TournamentDraftPanel tournamentId={tournament.id} participants={participants} />
      ) : (
        <Bracket rounds={rounds} champion={champion} />
      )}
    </div>
  );
}
