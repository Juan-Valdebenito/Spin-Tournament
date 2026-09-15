"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Participant } from "@/lib/types";

export default function TournamentDraftPanel({
  tournamentId,
  participants,
}: {
  tournamentId: string;
  participants: Participant[];
}) {
  const router = useRouter();
  const [names, setNames] = useState(
    participants.length > 0 ? participants.map((p) => p.name) : ["", ""]
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);

  const validCount = names.map((n) => n.trim()).filter(Boolean).length;

  function updateName(index: number, value: string) {
    setNames((prev) => prev.map((n, i) => (i === index ? value : n)));
  }

  function addRow() {
    setNames((prev) => [...prev, ""]);
  }

  function removeRow(index: number) {
    setNames((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function saveParticipants() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/participants`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo guardar");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  async function startTournament() {
    setError(null);
    setStarting(true);
    try {
      await saveParticipants();
      const res = await fetch(`/api/tournaments/${tournamentId}/start`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo iniciar el torneo");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Participantes</h2>
        <span className="text-xs text-muted">{validCount} cargados</span>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {names.map((n, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-6 shrink-0 text-right text-xs text-muted">{i + 1}.</span>
            <input
              type="text"
              value={n}
              onChange={(e) => updateName(i, e.target.value)}
              placeholder={`Jugador ${i + 1}`}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => removeRow(i)}
              disabled={names.length <= 2}
              className="shrink-0 rounded-md border border-border px-2 py-2 text-xs text-muted hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Quitar
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="mt-3 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted hover:border-primary hover:text-primary"
      >
        + Agregar participante
      </button>

      {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

      <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-4">
        <button
          type="button"
          onClick={saveParticipants}
          disabled={saving || starting}
          className="rounded-md border border-border px-4 py-2 text-sm font-semibold hover:border-primary disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
        <button
          type="button"
          onClick={startTournament}
          disabled={starting || validCount < 2}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {starting ? "Generando llave..." : "Sortear e iniciar torneo"}
        </button>
      </div>
      {validCount < 2 && (
        <p className="mt-2 text-xs text-muted">Se necesitan al menos 2 participantes para iniciar.</p>
      )}
    </div>
  );
}
