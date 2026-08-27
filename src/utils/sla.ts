import type { Ticket, TicketPriority, TicketStatus } from "../types"

export const SLA_HOURS_BY_PRIORITY: Record<TicketPriority, number> = {
  Crítica: 1,
  Alta: 3,
  Media: 6,
  Baja: 12,
  "Sin asignar": 0,
}

export type SlaState = "sin_iniciar" | "ok" | "warning" | "expired"

export const slaRunningStatuses: TicketStatus[] = ["Asignado", "En atención"]

export function isSlaRunning(ticket: Ticket): boolean {
  return slaRunningStatuses.includes(ticket.status) && !!ticket.slaStartedAt
}

export function getSlaState(ticket: Ticket, now = Date.now()): SlaState {
  if (!isSlaRunning(ticket) || ticket.slaHours <= 0) return "sin_iniciar"
  const elapsed = (now - new Date(ticket.slaStartedAt!).getTime()) / 3600000
  const ratio = elapsed / ticket.slaHours
  if (ratio >= 1) return "expired"
  if (ratio >= 0.8) return "warning"
  return "ok"
}

export function getSlaRemainingHours(
  ticket: Ticket,
  now = Date.now(),
): number | null {
  if (!isSlaRunning(ticket) || ticket.slaHours <= 0) return null
  const elapsed = (now - new Date(ticket.slaStartedAt!).getTime()) / 3600000
  return Math.max(0, ticket.slaHours - elapsed)
}

export function getSlaRatio(ticket: Ticket, now = Date.now()): number {
  const remaining = getSlaRemainingHours(ticket, now)
  if (remaining === null) return 0
  return Math.max(0, Math.min(1, remaining / ticket.slaHours))
}

export function formatSlaRemaining(hours: number): string {
  if (hours <= 0) return "Vencido"
  if (hours >= 24) return `${Math.floor(hours / 24)}d`
  if (hours < 1) return `${Math.ceil(hours * 60)} min`
  return `${Math.ceil(hours)}h`
}

export function slaTimeLabel(hours: number): string {
  if (hours <= 0) return "Sin SLA"
  return hours === 1 ? "1 hora" : `${hours} horas`
}

export const SLA_COLORS: Record<SlaState, string> = {
  sin_iniciar: "var(--faint)",
  ok: "var(--ok-bright)",
  warning: "var(--warn-bright)",
  expired: "var(--danger-bright)",
}

export const SLA_LABELS: Record<SlaState, string> = {
  sin_iniciar: "Sin iniciar",
  ok: "En tiempo",
  warning: "Por vencer",
  expired: "Vencido",
}
