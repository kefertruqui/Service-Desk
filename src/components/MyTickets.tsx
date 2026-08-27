import { useState } from "react"
import type { Ticket, View, TicketStatus } from "../types"
import { StatusBadge } from "./StatusBadge"
import { StatusStepper } from "./StatusStepper"

interface Props {
  tickets: Ticket[]
  onNavigate: (view: View, ticketId?: string) => void
  onUpdateTicket?: (id: string, updates: Partial<Ticket>) => void
}

const statusGroups: TicketStatus[] = [
  "Registrado",
  "Clasificado",
  "Asignado",
  "En atención",
  "Resuelto",
  "Cerrado",
  "Remitido a otra dependencia",
]

const PAGE_SIZE = 12

export default function MyTickets({
  tickets,
  onNavigate,
  onUpdateTicket,
}: Props) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [starHover, setStarHover] = useState<{
    id: string
    value: number | null
  } | null>(null)
  const [surveyStep, setSurveyStep] =
    useState<Record<string, "rating" | "filling" | "leaving" | "done">>({})
  const [ratingValue, setRatingValue] = useState<Record<string, number>>({})
  const [showBlockedModal, setShowBlockedModal] = useState(false)

  const surveyPhase = (t: Ticket): "rating" | "filling" | "leaving" | "done" =>
    surveyStep[t.id] ?? (t.rating != null ? "done" : "rating")

  const handleRate = (t: Ticket, star: number) => {
    setSurveyStep((prev) => ({ ...prev, [t.id]: "filling" }))
    setRatingValue((prev) => ({ ...prev, [t.id]: star }))
    const updates: Partial<Ticket> = { rating: star }
    if (t.status === "Remitido a otra dependencia" || t.status === "Resuelto") {
      updates.status = "Cerrado"
      updates.activities = [
        ...t.activities,
        {
          id: `a-${Date.now()}-close`,
          action: "Ticket cerrado tras calificación",
          author: t.user.name,
          timestamp: new Date().toISOString(),
          from: t.status,
          to: "Cerrado",
        },
      ]
    }
    onUpdateTicket?.(t.id, updates)
    window.setTimeout(() => {
      setSurveyStep((prev) => ({ ...prev, [t.id]: "leaving" }))
    }, 1800)
    window.setTimeout(() => {
      setSurveyStep((prev) => ({ ...prev, [t.id]: "done" }))
    }, 2500)
  }

  const filtered = tickets
    .filter((t) => {
      if (
        t.status === "Cerrado" &&
        t.rating != null &&
        (surveyStep[t.id] === "done" || surveyStep[t.id] === undefined)
      )
        return false
      if (
        t.status === "Remitido a otra dependencia" &&
        t.rating != null &&
        (surveyStep[t.id] === "done" || surveyStep[t.id] === undefined)
      )
        return false
      if (
        t.status === "Resuelto" &&
        t.rating != null &&
        (surveyStep[t.id] === "done" || surveyStep[t.id] === undefined)
      )
        return false
      const matchSearch =
        !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.number.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === "all" || t.status === statusFilter
      const matchType = typeFilter === "all" || t.type === typeFilter
      return matchSearch && matchStatus && matchType
    })
    .sort((a, b) => {
      const aPendingRating =
        (a.status === "Cerrado" ||
          a.status === "Remitido a otra dependencia" ||
          a.status === "Resuelto") &&
        a.rating == null
          ? 0
          : 1
      const bPendingRating =
        (b.status === "Cerrado" ||
          b.status === "Remitido a otra dependencia" ||
          b.status === "Resuelto") &&
        b.rating == null
          ? 0
          : 1
      if (aPendingRating !== bPendingRating)
        return aPendingRating - bPendingRating
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  const pendingRatingCount = filtered.filter(
    (t) =>
      (t.status === "Cerrado" ||
        t.status === "Remitido a otra dependencia" ||
        t.status === "Resuelto") &&
      t.rating == null,
  ).length

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageTickets = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )
  const from = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const to = Math.min(safePage * PAGE_SIZE, filtered.length)

  const resetPage = () => setPage(1)

  const pageNumbers: (number | "…")[] = (() => {
    const nums: (number | "…")[] = []
    const add = (n: number) => {
      if (n >= 1 && n <= totalPages && !nums.includes(n)) nums.push(n)
    }
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) add(i)
    } else {
      add(1)
      if (safePage > 3) nums.push("…")
      for (let i = safePage - 1; i <= safePage + 1; i++) add(i)
      if (safePage < totalPages - 2) nums.push("…")
      add(totalPages)
    }
    return nums
  })()

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const selectCls = (w: number) => ({
    borderColor: "var(--line)",
    outline: "none" as const,
    minWidth: w,
  })

  return (
    <>
      <div className="h-full flex flex-col">
        {/* Sección 1: Encabezado */}
        <div className="shrink-0 px-8 pt-8 pb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2
              className="text-[26px] leading-tight font-semibold whitespace-nowrap"
              style={{ color: "#005A7E", letterSpacing: "-0.02em" }}
            >
              Mis Tickets
            </h2>
            <p
              className="flex items-center gap-1.5 text-xs mt-0.5"
              style={{ color: "#86868b" }}
            >
              <svg
                className="w-3.5 h-3.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Consulte el estado y el avance de sus solicitudes. Haga clic en un
              ticket para ver su seguimiento.
            </p>
          </div>
          <button
            onClick={() =>
              pendingRatingCount > 0
                ? setShowBlockedModal(true)
                : onNavigate("new-request")
            }
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-colors"
            style={{ background: "#0A4159", color: "white" }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nueva Solicitud
          </button>
        </div>

        {/* Aviso de calificaciones pendientes */}
        {pendingRatingCount > 0 && (
          <div className="shrink-0 px-8 pb-3">
            <div
              className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2"
              style={{
                background: "#fdf5e0",
                color: "#92610a",
                border: "1px solid #f9d97b",
              }}
            >
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
              Tienes {pendingRatingCount} solicitud
              {pendingRatingCount !== 1 ? "es" : ""} por calificar. ¡Tu opinión
              es muy importante para nosotros!
            </div>
          </div>
        )}

        {/* Sección 3: Lista de tickets */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <div
            className="grid gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 px-8"
            style={{ gridAutoRows: "1fr" }}
          >
            {pageTickets.map((t) => {
              const pendingRating =
                (t.status === "Cerrado" ||
                  t.status === "Remitido a otra dependencia" ||
                  t.status === "Resuelto") &&
                t.rating == null
              const alertRing = pendingRating ? "#EDB02E" : undefined
              return (
                <div
                  key={t.id}
                  className={`relative h-full ${
                    surveyPhase(t) === "leaving" ? "ticket-leaving" : ""
                  }`}
                >
                  <div
                    className="relative flex flex-col h-full rounded-[18px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(0,0,0,0.08)]"
                    style={{
                      background: "#ffffff",
                      border: `1.5px solid ${alertRing ?? "transparent"}`,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                    }}
                  >
                    {/* Estado y fecha */}
                    <div className="flex items-center justify-between gap-2 px-4 pt-3">
                      <StatusBadge status={t.status} />
                      <span
                        className="text-[10px] shrink-0"
                        style={{ color: "#a1a1a6" }}
                      >
                        {formatDate(t.createdAt)}
                      </span>
                    </div>

                    {/* Mini-stepper */}
                    <div className="px-4 pt-2.5 pb-1">
                      <StatusStepper ticket={t} mode="compact" />
                    </div>

                    {/* Cuerpo */}
                    <div className="flex-1 px-4 pt-2 pb-2.5">
                      <p
                        className="text-[13px] font-semibold leading-snug line-clamp-2"
                        style={{ color: "#1d1d1f" }}
                      >
                        {t.title}
                      </p>
                      <p
                        className="text-[11px] mt-1 truncate"
                        style={{ color: "#86868b" }}
                      >
                        {t.category}
                        {t.subcategory ? ` / ${t.subcategory}` : ""}
                      </p>
                      <div
                        className="flex items-center gap-1.5 mt-2 text-[11px] min-w-0"
                        style={{ color: "#6e6e73" }}
                      >
                        <svg
                          className="w-3 h-3 shrink-0"
                          style={{ color: "#a1a1a6" }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span className="truncate">{t.user.name}</span>
                      </div>
                    </div>

                    {/* Perforación troquelada */}
                    <div className="relative">
                      <div
                        className="mx-3"
                        style={{
                          borderTop: `1.5px dashed ${alertRing ?? "#d2d2d7"}`,
                        }}
                      />
                      <div
                        className="absolute w-4 h-4 rounded-full"
                        style={{
                          left: -8,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "var(--bg)",
                        }}
                      />
                      <div
                        className="absolute w-4 h-4 rounded-full"
                        style={{
                          left: -8,
                          top: "50%",
                          transform: "translateY(-50%)",
                          border: `1.5px solid ${alertRing ?? "#d2d2d7"}`,
                          clipPath: "inset(0 0 0 50%)",
                        }}
                      />
                      <div
                        className="absolute w-4 h-4 rounded-full"
                        style={{
                          right: -8,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "var(--bg)",
                        }}
                      />
                      <div
                        className="absolute w-4 h-4 rounded-full"
                        style={{
                          right: -8,
                          top: "50%",
                          transform: "translateY(-50%)",
                          border: `1.5px solid ${alertRing ?? "#d2d2d7"}`,
                          clipPath: "inset(0 50% 0 0)",
                        }}
                      />
                    </div>

                    {/* Talón */}
                    <div className="flex items-center gap-2 px-4 py-2.5">
                      <span
                        className="text-[12px] font-semibold tracking-wide shrink-0"
                        style={{ color: "#1d1d1f" }}
                      >
                        {t.number}
                      </span>
                      {!pendingRating && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] shrink-0 px-2 py-0.5 rounded"
                          style={{ color: "#005A7E", background: "#e8f4f9" }}
                        >
                          <svg
                            className="w-3 h-3 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Tiene 3 días hábiles para la solución de su solicitud.
                        </span>
                      )}
                      {pendingRating && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-700 px-2 py-0.5 rounded-full ml-auto"
                          style={{
                            background: "#fdf5e0",
                            color: "#92610a",
                            border: "1px solid #f9d97b",
                          }}
                        >
                          <svg
                            className="w-3 h-3 shrink-0"
                            viewBox="0 0 24 24"
                            fill="#f5b301"
                            stroke="#f5b301"
                            strokeWidth="1.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                            />
                          </svg>
                          Calificar
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Overlay de calificación al hover */}
                  {pendingRating && (
                    <div
                      className="absolute inset-0 rounded-[18px] flex flex-col items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none"
                      style={{
                        background: "rgba(255,255,255,0.95)",
                        backdropFilter: "blur(2px)",
                      }}
                    >
                      <div className="pointer-events-auto flex flex-col items-center gap-3 px-6 py-5">
                        {surveyPhase(t) === "rating" && (
                          <>
                            <div
                              className="w-14 h-14 rounded-full flex items-center justify-center"
                              style={{
                                background:
                                  "linear-gradient(135deg, #fdf5e0 0%, #fef3cd 100%)",
                                boxShadow: "0 4px 14px rgba(245, 179, 1, 0.2)",
                              }}
                            >
                              <svg
                                className="w-8 h-8"
                                viewBox="0 0 24 24"
                                fill="#f5b301"
                                stroke="#f5b301"
                                strokeWidth="1"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                                />
                              </svg>
                            </div>
                            <div className="text-center">
                              <p
                                className="text-[15px] font-900 leading-tight"
                                style={{ color: "#005A7E" }}
                              >
                                ¡Cuéntanos cómo te fue!
                              </p>
                              <p
                                className="text-[12px] mt-1.5 leading-snug"
                                style={{ color: "#86868b" }}
                              >
                                ¿Qué tan satisfecho quedaste con la
                                <br />
                                atención y solución de la solicitud?
                              </p>
                            </div>
                            <div className="flex gap-1.5 mt-1">
                              {[1, 2, 3, 4, 5].map((star) => {
                                const preview =
                                  starHover?.id === t.id &&
                                  starHover.value != null
                                const lit = preview
                                  ? (starHover!.value ?? 0) >= star
                                  : false
                                return (
                                  <button
                                    key={star}
                                    onClick={() => handleRate(t, star)}
                                    onMouseEnter={() =>
                                      setStarHover({ id: t.id, value: star })
                                    }
                                    onMouseLeave={() =>
                                      setStarHover({ id: t.id, value: null })
                                    }
                                    className="cursor-pointer transition-all duration-150 hover:scale-125"
                                    aria-label={`${star} de 5 estrellas`}
                                  >
                                    <svg
                                      className="w-9 h-9"
                                      viewBox="0 0 24 24"
                                      fill={lit ? "#f5b301" : "none"}
                                      stroke={lit ? "#f5b301" : "#d1d5db"}
                                      strokeWidth="1.2"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                                      />
                                    </svg>
                                  </button>
                                )
                              })}
                            </div>
                          </>
                        )}

                        {surveyPhase(t) === "filling" && (
                          <>
                            <div
                              className="w-14 h-14 rounded-full flex items-center justify-center"
                              style={{
                                background:
                                  "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
                                boxShadow: "0 4px 14px rgba(22, 163, 74, 0.15)",
                              }}
                            >
                              <svg
                                className="w-7 h-7"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#16a34a"
                                strokeWidth="2.5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                            <div className="flex gap-1.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={star}
                                  className="w-8 h-8"
                                  viewBox="0 0 24 24"
                                  fill={
                                    star <= (ratingValue[t.id] ?? 0)
                                      ? "#f5b301"
                                      : "none"
                                  }
                                  stroke={
                                    star <= (ratingValue[t.id] ?? 0)
                                      ? "#f5b301"
                                      : "#d1d5db"
                                  }
                                  strokeWidth="1.2"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                                  />
                                </svg>
                              ))}
                            </div>
                            <p
                              className="text-[13px] font-700"
                              style={{ color: "#16a34a" }}
                            >
                              ¡Gracias!
                            </p>
                            <p
                              className="text-[11px]"
                              style={{ color: "#86868b" }}
                            >
                              Seguimos trabajando para mejorar.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {filtered.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-[13px]" style={{ color: "#a1a1a6" }}>
                  No se encontraron tickets con los filtros seleccionados.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sección 4: Paginación */}
        {filtered.length > 0 && (
          <div className="shrink-0 px-8 py-3.5 flex items-center justify-between gap-3">
            <span className="text-xs" style={{ color: "#86868b" }}>
              Mostrando {from}–{to} de {filtered.length} ticket
              {filtered.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="w-8 h-8 rounded-full text-[13px] transition-colors disabled:opacity-30 hover:bg-black/5"
                style={{ color: "#1d1d1f" }}
              >
                ‹
              </button>
              {pageNumbers.map((n, i) =>
                n === "…" ? (
                  <span
                    key={`e${i}`}
                    className="w-8 h-8 flex items-center justify-center text-xs"
                    style={{ color: "#a1a1a6" }}
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className="w-8 h-8 rounded-full text-[13px] font-medium transition-colors hover:bg-black/5"
                    style={{
                      background: n === safePage ? "#005A7E" : "transparent",
                      color: n === safePage ? "white" : "#1d1d1f",
                    }}
                  >
                    {n}
                  </button>
                ),
              )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="w-8 h-8 rounded-full text-[13px] transition-colors disabled:opacity-30 hover:bg-black/5"
                style={{ color: "#1d1d1f" }}
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: tickets pendientes por calificar */}
      {showBlockedModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          <div
            className="rounded-2xl max-w-md w-full mx-4 p-6 flex flex-col items-center gap-4"
            style={{
              background: "#e8f4f9",
            }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #e8f4f9 0%, #d5ecf5 100%)",
                boxShadow: "0 4px 14px rgba(0, 90, 126, 0.25)",
              }}
            >
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="#005A7E"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-[15px] font-700" style={{ color: "#1d1d1f" }}>
                Tienes encuestas pendientes por calificar
              </p>
              <p
                className="text-[12px] mt-2 leading-relaxed"
                style={{ color: "#86868b" }}
              >
                Para crear una nueva solicitud, primero debes calificar las{" "}
                {pendingRatingCount} solicitud
                {pendingRatingCount !== 1 ? "es" : ""} que tienes pendiente
                {pendingRatingCount !== 1 ? "s" : ""}. Dirígete a la sección{" "}
                <strong>Mis Tickets</strong> para completar la encuesta.
              </p>
            </div>
            <button
              onClick={() => setShowBlockedModal(false)}
              className="w-full py-2.5 rounded-full text-[13px] font-700 transition-colors cursor-pointer"
              style={{ background: "#005A7E", color: "white" }}
            >
              Ir a Mis Tickets
            </button>
          </div>
        </div>
      )}
    </>
  )
}
