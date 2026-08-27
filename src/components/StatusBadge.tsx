import type { TicketStatus, TicketPriority } from "../types"

const statusConfig: Record<TicketStatus, {
  bg: string
  fg: string
  label: string
}> = {
  // Degradado del ciclo de vida: azul → teal → verde (Resuelto); grises para terminales
  Registrado: { bg: "var(--info-bg)", fg: "var(--info)", label: "Registrado" },
  Clasificado: {
    bg: "rgba(6, 111, 135, 0.10)",
    fg: "#066F87",
    label: "Clasificado",
  },
  Asignado: {
    bg: "rgba(16, 133, 127, 0.10)",
    fg: "#10857F",
    label: "Asignado",
  },
  "En atención": {
    bg: "rgba(22, 149, 134, 0.12)",
    fg: "#169586",
    label: "En atención",
  },
  Resuelto: { bg: "var(--ok-bg)", fg: "var(--ok)", label: "Resuelto" },
  Cerrado: { bg: "var(--hover)", fg: "var(--muted)", label: "Cerrado" },
  "Remitido a otra dependencia": {
    bg: "var(--hover)",
    fg: "var(--muted)",
    label: "Remitido",
  },
}

const priorityConfig: Record<TicketPriority, { bg: string; fg: string }> = {
  Crítica: { bg: "var(--danger-bg)", fg: "var(--danger)" },
  Alta: { bg: "var(--warn-bg)", fg: "var(--warn)" },
  Media: { bg: "var(--gold-bg)", fg: "var(--gold)" },
  Baja: { bg: "var(--info-bg)", fg: "var(--info)" },
  "Sin asignar": { bg: "var(--slate-bg)", fg: "var(--slate)" },
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  const cfg = statusConfig[status] ?? statusConfig["Registrado"]
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-600 whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.fg }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: cfg.fg }}
      />
      {cfg.label}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const cfg = priorityConfig[priority] ?? priorityConfig["Baja"]
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-600 whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.fg }}
    >
      {priority}
    </span>
  )
}
