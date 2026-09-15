"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateTournamentForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [names, setNames] = useState(["", ""]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateName(index: number, value: string) {
    setNames((prev) => prev.map((n, i) => (i === index ? value : n)));
  }

  function addRow() {
    setNames((prev) => [...prev, ""]);
  }

  function removeRow(index: number) {
    setNames((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleaned = names.map((n) => n.trim()).filter(Boolean);
    if (!name.trim()) {
      setError("Ingresa un nombre para el torneo");
      return;
    }
    if (cleaned.length < 2) {
      setError("Agrega al menos 2 participantes");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, participantNames: cleaned }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo crear el torneo");
      router.push(`/torneos/${data.tournament.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <label className="block text-sm font-semibold" htmlFor="tournament-name">
          Nombre del torneo
        </label>
        <input
          id="tournament-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Copa Spin 2026"
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold">Participantes</label>
          <span className="text-xs text-muted">{names.filter((n) => n.trim()).length} cargados</span>
        </div>
        <div className="mt-2 flex flex-col gap-2">
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
                aria-label={`Quitar participante ${i + 1}`}
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
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Creando..." : "Crear torneo"}
      </button>
    </form>
  );
}
