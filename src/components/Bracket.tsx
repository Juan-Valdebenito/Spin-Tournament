"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MatchDisplay, RoundDisplay } from "@/lib/types";

const SLOT_BASE = 96;
const MATCH_HEIGHT = 64;
const MATCH_WIDTH = 208;
const STUB = 24;

function PlayerRow({
  name,
  score,
  isWinner,
  isPlaceholder,
}: {
  name: string;
  score: number | null;
  isWinner: boolean;
  isPlaceholder?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-3 py-1.5 text-sm ${
        isWinner ? "font-semibold text-foreground" : "text-muted"
      } ${isPlaceholder ? "italic text-muted" : ""}`}
    >
      <span className="truncate">{name}</span>
      {score !== null && (
        <span
          className={`ml-2 shrink-0 rounded px-1.5 text-xs ${
            isWinner ? "bg-primary/10 text-primary" : "bg-black/5 text-muted"
          }`}
        >
          {score}
        </span>
      )}
    </div>
  );
}

function MatchBox({ match, onClick }: { match: MatchDisplay; onClick: () => void }) {
  const p1Name = match.player1?.name ?? (match.player2 ? "Por definir" : "Por definir");
  const p2Name = match.player2?.name ?? (match.isBye ? "BYE" : "Por definir");
  const clickable = !!match.player1 && !!match.player2;

  return (
    <button
      type="button"
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
      style={{ width: MATCH_WIDTH, height: MATCH_HEIGHT }}
      className={`flex flex-col justify-center overflow-hidden rounded-md border bg-surface shadow-sm transition ${
        clickable ? "cursor-pointer border-border hover:border-primary hover:shadow" : "cursor-default border-border/70"
      }`}
    >
      <PlayerRow
        name={p1Name}
        score={match.score1}
        isWinner={!!match.winnerId && match.winnerId === match.player1?.id}
        isPlaceholder={!match.player1}
      />
      <div className="border-t border-border/70" />
      <PlayerRow
        name={p2Name}
        score={match.score2}
        isWinner={!!match.winnerId && match.winnerId === match.player2?.id}
        isPlaceholder={!match.player2 && !match.isBye}
      />
    </button>
  );
}

function VerticalConnector({ top, height }: { top: number; height: number }) {
  return (
    <div
      aria-hidden
      className="absolute bg-border"
      style={{ right: -STUB, top, height, width: 2 }}
    />
  );
}

function RightStub() {
  return (
    <div
      aria-hidden
      className="absolute bg-border"
      style={{ right: -STUB, top: MATCH_HEIGHT / 2, width: STUB, height: 2 }}
    />
  );
}

function LeftStub() {
  return (
    <div
      aria-hidden
      className="absolute bg-border"
      style={{ left: -STUB, top: MATCH_HEIGHT / 2, width: STUB, height: 2 }}
    />
  );
}

function MatchSlot({
  match,
  slotHeight,
  hasLeftStub,
  hasRightStub,
  onSelect,
}: {
  match: MatchDisplay;
  slotHeight: number;
  hasLeftStub: boolean;
  hasRightStub: boolean;
  onSelect: (m: MatchDisplay) => void;
}) {
  return (
    <div style={{ height: slotHeight }} className="relative flex items-center justify-center">
      <div className="relative">
        {hasLeftStub && <LeftStub />}
        {hasRightStub && <RightStub />}
        <MatchBox match={match} onClick={() => onSelect(match)} />
      </div>
    </div>
  );
}

function ResultModal({
  match,
  onClose,
  onSaved,
}: {
  match: MatchDisplay;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [score1, setScore1] = useState(match.score1 ?? 0);
  const [score2, setScore2] = useState(match.score2 ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/matches/${match.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score1, score2 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo guardar el resultado");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold">Cargar resultado</h3>
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-sm">{match.player1?.name}</span>
            <input
              type="number"
              min={0}
              value={score1}
              onChange={(e) => setScore1(Number(e.target.value))}
              className="w-16 rounded-md border border-border px-2 py-1 text-center text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-sm">{match.player2?.name}</span>
            <input
              type="number"
              min={0}
              value={score2}
              onChange={(e) => setScore2(Number(e.target.value))}
              className="w-16 rounded-md border border-border px-2 py-1 text-center text-sm outline-none focus:border-primary"
            />
          </div>
        </div>
        {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-3 py-2 text-sm font-semibold hover:bg-black/5"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Bracket({
  rounds,
  champion,
}: {
  rounds: RoundDisplay[];
  champion: { id: string; name: string } | null;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<MatchDisplay | null>(null);

  if (rounds.length === 0) return null;

  const totalHeight = rounds[0].matches.length * SLOT_BASE;

  return (
    <div className="flex flex-col gap-6">
      {champion && (
        <div className="flex items-center gap-3 rounded-lg border border-accent/30 bg-accent-soft p-4">
          <span className="text-2xl" aria-hidden>
            🏆
          </span>
          <div>
            <p className="label-mono text-xs font-semibold uppercase text-accent/80">Campeon</p>
            <p className="text-lg font-bold text-accent">{champion.name}</p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto pb-4">
        <div className="flex items-start gap-12" style={{ minWidth: rounds.length * (MATCH_WIDTH + 48) }}>
          {rounds.map((round) => {
            const slotHeight = totalHeight / round.matches.length;
            const isLastRound = round.matches.length === 1;

            return (
              <div key={round.round} className="flex flex-col">
                <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-muted">
                  {round.name}
                </p>
                <div style={{ height: totalHeight }} className="flex flex-col">
                  {isLastRound ? (
                    <MatchSlot
                      match={round.matches[0]}
                      slotHeight={slotHeight}
                      hasLeftStub={round.round > 0}
                      hasRightStub={false}
                      onSelect={setSelected}
                    />
                  ) : (
                    Array.from({ length: round.matches.length / 2 }).map((_, pairIndex) => {
                      const top = round.matches[pairIndex * 2];
                      const bottom = round.matches[pairIndex * 2 + 1];
                      return (
                        <div
                          key={pairIndex}
                          className="relative"
                          style={{ height: slotHeight * 2 }}
                        >
                          <VerticalConnector top={slotHeight / 2} height={slotHeight} />
                          <MatchSlot
                            match={top}
                            slotHeight={slotHeight}
                            hasLeftStub={round.round > 0}
                            hasRightStub
                            onSelect={setSelected}
                          />
                          <MatchSlot
                            match={bottom}
                            slotHeight={slotHeight}
                            hasLeftStub={round.round > 0}
                            hasRightStub
                            onSelect={setSelected}
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <ResultModal
          match={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
