import CreateTournamentForm from "@/components/CreateTournamentForm";

export default function NewTournamentPage() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold">Nuevo torneo</h1>
      <p className="mt-1 text-sm text-muted">
        Los participantes se pueden editar despues, mientras el torneo siga en borrador.
      </p>
      <div className="mt-6 rounded-lg border border-border bg-surface p-6">
        <CreateTournamentForm />
      </div>
    </div>
  );
}
