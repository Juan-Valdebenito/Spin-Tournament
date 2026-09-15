import type { TournamentStatus } from "@/lib/types";

const STATUS_LABEL: Record<TournamentStatus, string> = {
  draft: "Borrador",
  in_progress: "En curso",
  completed: "Finalizado",
};

const STATUS_STYLE: Record<TournamentStatus, string> = {
  draft: "bg-warn-soft text-warn",
  in_progress: "bg-success-soft text-success",
  completed: "bg-primary/10 text-primary",
};

export default function StatusPill({ status }: { status: TournamentStatus }) {
  return (
    <span
      className={`label-mono inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase ${STATUS_STYLE[status]}`}
    >
      {status === "in_progress" && <span className="h-1.5 w-1.5 rounded-full bg-success" />}
      {STATUS_LABEL[status]}
    </span>
  );
}
