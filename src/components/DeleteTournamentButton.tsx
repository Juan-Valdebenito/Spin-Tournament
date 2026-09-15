"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteTournamentButton({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("¿Eliminar este torneo? Esta accion no se puede deshacer.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo eliminar el torneo");
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error inesperado");
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-muted hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      {deleting ? "Eliminando..." : "Eliminar torneo"}
    </button>
  );
}
