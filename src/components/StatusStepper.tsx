import type { Ticket, TicketStatus, TicketActivity } from "../types"

const TRACK_FLOW: TicketStatus[] = [
  "Registrado",
  "Clasificado",
  "Asignado",
  "En atención",
  "Resuelto",
  "Cerrado",
]

function getFlow(t: Ticket): TicketStatus[] {
  if (t.status === "Remitido a otra dependencia") {
    return ["Registrado", "Remitido a otra dependencia", "Cerrado"]
  }
  const wasRemitted = t.activities.some(
    (a) => a.to === "Remitido a otra dependencia",
  )
  if (wasRemitted && t.status === "Cerrado") {
    return ["Registrado", "Remitido a otra dependencia", "Cerrado"]
  }
  return TRACK_FLOW
}

function getStatusDates(t: Ticket): Partial<Record<TicketStatus, string>> {
  const dates: Partial<Record<TicketStatus, string>> = {
    Registrado: t.createdAt,
  }
  t.activities.forEach((a) => {
    if (a.to) dates[(a.to as TicketStatus)] = a.timestamp
  })
  if (!dates[t.status]) dates[t.status] = t.updatedAt
  return dates
}

function getFlowActivities(
  t: Ticket,
): Partial<Record<TicketStatus, TicketActivity>> {
  const map: Partial<Record<TicketStatus, TicketActivity>> = {}
  const sorted = [...t.activities].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp),
  )
  if (sorted.length > 0) map["Registrado"] = sorted[0]
  sorted.forEach((a) => {
    if (a.to) map[(a.to as TicketStatus)] = a
  })
  if (!map[t.status] && t.status !== "Registrado") {
    const byAction = sorted.find((a) =>
      a.action.toLowerCase().includes("asignad"),
    )
    if (byAction && t.status === "Asignado") map["Asignado"] = byAction
  }
  return map
}

function getReachedStatuses(t: Ticket): Set<TicketStatus> {
  const reached = new Set<TicketStatus>(["Registrado"])
  t.activities.forEach((a) => {
    if (a.to) reached.add(a.to as TicketStatus)
  })
  reached.add(t.status)
  return reached
}

const defaultFormatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

interface StatusStepperProps {
  ticket: Ticket
  mode?: "compact" | "full" | "timeline"
  formatDateTime?: (iso: string) => string
  ratedClosed?: boolean
}

export function StatusStepper({
  ticket,
  mode = "full",
  formatDateTime = defaultFormatDateTime,
  ratedClosed,
}: StatusStepperProps) {
  const flow = getFlow(ticket)
  const dates = getStatusDates(ticket)
  const currentIdx = flow.indexOf(ticket.status)

  if (mode === "compact") {
    const filled = currentIdx + 1
    const total = flow.length
    return (
      <div className="flex items-center gap-2 w-full">
        <div
          className="flex-1 flex rounded-full overflow-hidden"
          style={{ height: 6 }}
        >
          {flow.map((s, i) => (
            <div
              key={s}
              className="h-full"
              style={{
                flex: 1,
                background: i <= currentIdx ? "#34AB1E" : "#e2e8f0",
              }}
            />
          ))}
        </div>
        <span
          className="text-[10px] font-600 shrink-0"
          style={{ color: "#94a3b8" }}
        >
          {filled}/{total}
        </span>
      </div>
    )
  }

  if (mode === "timeline") {
    const flowActivities = getFlowActivities(ticket)
    const reached = getReachedStatuses(ticket)

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-600" style={{ color: "#005A7E" }}>
            {ticket.status}
          </span>
          <span className="text-[11px] font-600" style={{ color: "#94a3b8" }}>
            {currentIdx + 1}/{flow.length}
          </span>
        </div>
        <div
          className="relative w-full rounded-full overflow-hidden"
          style={{ height: 8, background: "#e2e8f0" }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
            style={{
              width: `${((currentIdx + 1) / flow.length) * 100}%`,
              background: "linear-gradient(90deg, #34AB1E, #2d9a16)",
            }}
          />
        </div>
        <div className="relative">
          <div
            className="absolute left-[7px] top-[14px] bottom-[14px] w-px"
            style={{ background: "#e2e8f0" }}
          />
          <div className="space-y-0">
            {flow.map((s, i) => {
              const done = i < currentIdx || (ratedClosed && i === currentIdx)
              const current = i === currentIdx && !done
              const reachedStep = reached.has(s)
              const skipped = !done && !current && reachedStep && i > currentIdx
              const date = dates[s]
              const act = flowActivities[s]
              return (
                <div key={s} className="flex gap-3 py-2">
                  <div
                    className="relative shrink-0 flex items-start"
                    style={{ height: 28 }}
                  >
                    <span
                      className="w-[15px] h-[15px] rounded-full flex items-center justify-center relative z-10"
                      style={{
                        background: done
                          ? "#34AB1E"
                          : current
                            ? "#005A7E"
                            : "#f1f5f9",
                        border: done || current ? "none" : "2px dashed #cbd5e1",
                      }}
                    >
                      {done && (
                        <svg
                          className="w-2 h-2 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                      {current && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 pt-px">
                    <p
                      className="text-[12px] font-600 leading-tight"
                      style={{
                        color: done
                          ? "#334155"
                          : current
                            ? "#005A7E"
                            : "#cbd5e1",
                      }}
                    >
                      {s}
                    </p>
                    {act && (done || current) && (
                      <p
                        className="text-[10px] mt-0.5 leading-tight"
                        style={{ color: "#64748b" }}
                      >
                        {act.author} · {act.action}
                        {date && ` · ${formatDateTime(date)}`}
                      </p>
                    )}
                    {s === "Cerrado" && done && ticket.rating && (
                      <div className="flex items-center gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className="w-3 h-3"
                            viewBox="0 0 24 24"
                            fill={star <= ticket.rating! ? "#f5b301" : "none"}
                            stroke={
                              star <= ticket.rating! ? "#f5b301" : "#cbd5e1"
                            }
                            strokeWidth="1.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                            />
                          </svg>
                        ))}
                        <span
                          className="text-[10px] ml-1 font-500"
                          style={{ color: "#94a3b8" }}
                        >
                          {ticket.rating}/5
                        </span>
                      </div>
                    )}
                    {skipped && (
                      <p
                        className="text-[10px] mt-0.5 leading-tight italic"
                        style={{ color: "#cbd5e1" }}
                      >
                        No Aplica
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const pct = Math.round(((currentIdx + 1) / flow.length) * 100)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-600" style={{ color: "#005A7E" }}>
          {ticket.status}
        </span>
        <span className="text-[11px] font-600" style={{ color: "#94a3b8" }}>
          {currentIdx + 1}/{flow.length} · {pct}%
        </span>
      </div>
      <div
        className="relative w-full rounded-full overflow-hidden"
        style={{ height: 8, background: "#e2e8f0" }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #34AB1E, #2d9a16)",
          }}
        />
      </div>
      <div className="space-y-1">
        {flow.map((s, i) => {
          const done = i < currentIdx || (ratedClosed && i === currentIdx)
          const current = i === currentIdx && !done
          const date = dates[s]
          return (
            <div key={s} className="flex items-center gap-2 py-0.5">
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: done
                    ? "#34AB1E"
                    : current
                      ? "#005A7E"
                      : "transparent",
                  border: done || current ? "none" : "1.5px solid #cbd5e1",
                }}
              >
                {done && (
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
                {current && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </span>
              <span
                className="text-[11px] font-500 flex-1"
                style={{
                  color: done ? "#334155" : current ? "#005A7E" : "#cbd5e1",
                }}
              >
                {s}
              </span>
              {(done || current) && date && (
                <span
                  className="text-[10px] shrink-0"
                  style={{ color: "#94a3b8" }}
                >
                  {formatDateTime(date)}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
