import { useState, useEffect, useRef } from "react"
import type {
  Ticket,
  View,
  TicketStatus,
  TicketPriority,
  UserInfo,
  ClosureCode,
} from "../types"
import { StatusBadge, PriorityBadge } from "./StatusBadge"
import { StatusStepper } from "./StatusStepper"
import {
  SLA_HOURS_BY_PRIORITY,
  slaRunningStatuses,
  getSlaState,
  getSlaRemainingHours,
  formatSlaRemaining,
  slaTimeLabel,
  SLA_COLORS,
  SLA_LABELS,
} from "../utils/sla"

interface Props {
  tickets: Ticket[]
  onNavigate: (view: View, ticketId?: string) => void
  onUpdateTicket?: (id: string, updates: Partial<Ticket>) => void
  user?: UserInfo
}

const statusOptions: TicketStatus[] = ["Asignado", "En atención"]
const FLOW_ORDER: TicketStatus[] = [
  "Registrado",
  "Clasificado",
  "Asignado",
  "En atención",
  "Resuelto",
  "Cerrado",
  "Remitido a otra dependencia",
]
const flowIdx = (s: TicketStatus) => FLOW_ORDER.indexOf(s)
const priorities: TicketPriority[] = ["Crítica", "Alta", "Media", "Baja"]
const technicians = [
  "Juan Claros",
  "Danny Marles",
  "Fabio Torres",
  "Stella Suarez",
  "Json Garcia",
]

const relTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "ahora"
  if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h} h`
  return `hace ${Math.floor(h / 24)} d`
}

interface SolutionStep {
  id: string
  description: string
  note: string
}

export default function AssignedTickets({
  tickets,
  onNavigate,
  onUpdateTicket,
  user,
}: Props) {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const [solutionSteps, setSolutionSteps] = useState<SolutionStep[]>([])
  const [activeStepId, setActiveStepId] = useState<string | null>(null)
  const [customStepInput, setCustomStepInput] = useState("")

  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])
  const [evidenceError, setEvidenceError] = useState("")
  const [evidenceDragOver, setEvidenceDragOver] = useState(false)
  const evidenceInputRef = useRef<HTMLInputElement>(null)
  const messageRef = useRef<HTMLDivElement>(null)
  const [solutionMessage, setSolutionMessage] = useState("")

  const [showEscalate, setShowEscalate] = useState(false)
  const [escalateTo, setEscalateTo] = useState("")
  const [escalateReason, setEscalateReason] = useState("")
  const [escalateSearch, setEscalateSearch] = useState("")

  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [page, setPage] = useState(1)

  const myTickets = tickets.filter((t) => {
    if (!user?.name || !t.technician) return false
    return (
      t.technician
        .split(",")
        .map((s) => s.trim())
        .includes(user.name) &&
      ![
        "Clasificado",
        "Resuelto",
        "Cerrado",
        "Remitido a otra dependencia",
      ].includes(t.status)
    )
  })

  const assignedTickets =
    myTickets.length > 0
      ? myTickets
      : tickets.filter(
          (t) =>
            !!t.technician &&
            ![
              "Clasificado",
              "Resuelto",
              "Cerrado",
              "Remitido a otra dependencia",
            ].includes(t.status),
        )

  console.log(
    "[AssignedTickets] user:",
    user?.name,
    "| myTickets:",
    myTickets.length,
    "| showing:",
    assignedTickets.length,
  )

  const now = Date.now()
  const overdueCount = assignedTickets.filter(
    (t) => getSlaState(t, now) === "warning",
  ).length
  const expiredCount = assignedTickets.filter(
    (t) => getSlaState(t, now) === "expired",
  ).length
  const kpiEnAtencion = assignedTickets.filter(
    (t) => t.status === "En atención",
  ).length
  const kpiAsignados = assignedTickets.filter(
    (t) => t.status === "Asignado",
  ).length

  const filtered = assignedTickets.filter((t) => {
    const ms =
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.number.toLowerCase().includes(search.toLowerCase())
    const mst = filterStatus === "all" || t.status === filterStatus
    const mp = filterPriority === "all" || t.priority === filterPriority
    return ms && mst && mp
  })

  const queueRank = (t: Ticket): number => {
    const s = getSlaState(t, now)
    if (s === "expired") return 0
    if (s === "warning") return 1
    if (t.status === "Asignado") return 2
    if (t.status === "En atención") return 3
    if (t.status === "Resuelto") return 4
    if (t.status === "Cerrado") return 5
    return 3
  }

  const sorted = [...filtered].sort((a, b) => {
    const ra = queueRank(a)
    const rb = queueRank(b)
    if (ra !== rb) return ra - rb
    if (ra === 0 || ra === 1) {
      const ha = getSlaRemainingHours(a, now) ?? Number.POSITIVE_INFINITY
      const hb = getSlaRemainingHours(b, now) ?? Number.POSITIVE_INFINITY
      return ha - hb
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  const PAGE_SIZE = 12
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const paginated = sorted.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )
  const rangeStart = sorted.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, sorted.length)

  const addEvidence = (list: FileList | null) => {
    if (!list) return
    const imageTypes = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"]
    const invalid = Array.from(list).filter(
      (f) =>
        !imageTypes.includes((f.name.split(".").pop() || "").toLowerCase()) &&
        !f.type.startsWith("image/"),
    )
    const valid = Array.from(list).filter(
      (f) =>
        imageTypes.includes((f.name.split(".").pop() || "").toLowerCase()) ||
        f.type.startsWith("image/"),
    )
    setEvidenceFiles((prev) => {
      const names = new Set(prev.map((f) => f.name))
      return [...prev, ...valid.filter((f) => !names.has(f.name))]
    })
    setEvidenceError(
      invalid.length > 0
        ? `Solo se permiten imágenes (PNG, JPG, GIF, WEBP, SVG). Se omitió${
            invalid.length > 1 ? "n" : ""
          } ${invalid.length} archivo${
            invalid.length > 1 ? "s" : ""
          } no válido${invalid.length > 1 ? "s" : ""}.`
        : "",
    )
  }

  const openPanel = (t: Ticket) => {
    setSelectedTicket(t)
    setCustomStepInput("")
    setEvidenceFiles([])
    setShowEscalate(false)
    setEscalateTo("")
    setEscalateReason("")
    setEscalateSearch("")

    setSolutionSteps([])
    setEvidenceError("")
    setSolutionMessage(
      [
        `Estimado/a ${t.user?.name ?? "usuario"}:`,
        ``,
        `Nos complace informarle que su solicitud ${t.number} – ${t.title} ha sido resuelta.`,
        ``,
        `Solución aplicada: [Describa aquí la solución...]`,
        ``,
        `Para conocer su experiencia, le invitamos a ingresar al módulo de *Service Desk y diligenciar la encuesta de satisfacción de la atención*.`,
        ``,
        `Cordialmente,`,
        `Mesa de Servicios – Oficina Asesora de Tecnologías de la Información`,
        `Universidad de la Amazonia`,
      ].join("\n"),
    )

    setPanelOpen(true)
  }

  const closePanel = () => {
    setPanelOpen(false)
    setSelectedTicket(null)
  }

  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.innerHTML = messageToHtml(solutionMessage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTicket])

  const makeActivity = (act: string, from?: string, to?: string) => ({
    id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    action: act,
    author: user?.name ?? "Técnico",
    timestamp: new Date().toISOString(),
    from,
    to,
  })

  const setStepDescription = (id: string, description: string) => {
    setSolutionSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, description } : s)),
    )
  }

  const addCustomStep = () => {
    if (!customStepInput.trim()) return
    const id = `custom-${Date.now()}`
    setSolutionSteps((prev) => [
      ...prev,
      { id, description: customStepInput.trim(), note: "" },
    ])
    setActiveStepId(id)
    setCustomStepInput("")
  }

  const removeStep = (id: string) => {
    setSolutionSteps((prev) => {
      const next = prev.filter((s) => s.id !== id)
      if (activeStepId === id)
        setActiveStepId(next.length ? next[next.length - 1].id : null)
      return next
    })
  }

  const filteredEscalateTechs = technicians.filter((t) =>
    t.toLowerCase().includes(escalateSearch.trim().toLowerCase()),
  )

  const handleEscalate = () => {
    if (!selectedTicket || !escalateTo.trim()) return
    const acts = [...selectedTicket.activities]
    acts.push(
      makeActivity(
        "Ticket escalado",
        selectedTicket.technician,
        escalateTo.trim(),
      ),
    )
    if (escalateReason.trim()) {
      acts.push(makeActivity(`Motivo: ${escalateReason.trim()}`))
    }
    onUpdateTicket?.(selectedTicket.id, {
      technician: escalateTo.trim(),
      activities: acts,
    })
    setShowEscalate(false)
    setEscalateTo("")
    setEscalateReason("")
    setEscalateSearch("")
    closePanel()
  }

  const handleResolve = () => {
    if (
      !selectedTicket ||
      !solutionMessage.trim() ||
      solutionSteps.length === 0
    )
      return
    const fromStatus = selectedTicket.status
    const acts = [...selectedTicket.activities]

    if (fromStatus === "Asignado") {
      acts.push(makeActivity("Estado cambiado", fromStatus, "En atención"))
    }
    acts.push(makeActivity("Estado cambiado", "En atención", "Resuelto"))
    acts.push(
      makeActivity(`Mensaje enviado al solicitante: ${solutionMessage.trim()}`),
    )

    const updates: Partial<Ticket> = {
      status: "Resuelto",
      activities: acts,
      comments: [
        ...selectedTicket.comments,
        {
          id: `c-${Date.now()}-sol`,
          author: user?.name ?? "Técnico",
          role: "Oficina Asesora de Tecnologías de la Información",
          content: solutionMessage.trim(),
          timestamp: new Date().toISOString(),
          isInternal: false,
        },
      ],
    }
    if (solutionSteps.length > 0) {
      updates.solutionStages = solutionSteps.map((s) => ({
        id: s.id,
        description: s.description,
        done: true,
        doneAt: new Date().toISOString(),
      }))
    }
    if (evidenceFiles.length > 0) {
      updates.solutionEvidence = [
        ...(selectedTicket.solutionEvidence ?? []),
        ...evidenceFiles.map((f) => f.name),
      ]
    }
    onUpdateTicket?.(selectedTicket.id, updates)
    closePanel()
  }

  const handleClose = (t: Ticket) => {
    onUpdateTicket?.(t.id, {
      status: "Cerrado",
      closureCode: "resuelto",
      activities: [
        ...t.activities,
        makeActivity("Ticket cerrado", t.status, "Cerrado"),
      ],
    })
  }

  const handleStartWork = (t: Ticket) => {
    const updated: Ticket = {
      ...t,
      status: "En atención",
      slaStartedAt: t.slaStartedAt ?? new Date().toISOString(),
      activities: [
        ...t.activities,
        makeActivity("Estado cambiado", t.status, "En atención"),
      ],
    }
    onUpdateTicket?.(t.id, updated)
    setSelectedTicket(updated)
  }

  const canResolve = (t: Ticket) =>
    !["Resuelto", "Cerrado", "Remitido a otra dependencia"].includes(t.status)

  const stepsTotal = solutionSteps.length

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("es-CO", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })

  const messageToHtml = (text: string) => {
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br />")
    return escaped.replace(/\*([^*]+)\*/g, "<b>$1</b>")
  }

  const syncMessageFromHtml = () => {
    if (messageRef.current) {
      setSolutionMessage(messageRef.current.innerText.replace(/\n+$/, ""))
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Encabezado */}
      <div className="shrink-0 px-8 pt-8 pb-6">
        <h2
          className="text-[26px] leading-tight font-semibold whitespace-nowrap"
          style={{ color: "#005A7E", letterSpacing: "-0.02em" }}
        >
          Mis Tickets Asignados{" "}
          <span
            className="font-normal whitespace-nowrap"
            style={{ color: "#86868b" }}
          >
            - Service Desk
          </span>
        </h2>
      </div>

      {/* KPIs */}
      <div className="shrink-0 px-8 pb-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total asignados",
            value: assignedTickets.length,
            bg: "#e8f4f9",
            color: "#005A7E",
            icon: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-6.93 4 4 0 004 6.93zM16 7a4 4 0 11-8 0 4 4 0 018 0z",
          },
          {
            label: "En atención",
            value: kpiEnAtencion,
            bg: "#e5f5f3",
            color: "#0d6b5e",
            icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
          },
          {
            label: "Por vencer",
            value: overdueCount,
            bg: "#fef0e4",
            color: "#E47113",
            icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
          },
          {
            label: "Asignados por atender",
            value: kpiAsignados,
            bg: "#dcfce7",
            color: "#166534",
            icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
          },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3"
            style={{ background: "#f8fafc" }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: k.bg }}
            >
              <svg
                className="w-4.5 h-4.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke={k.color}
                strokeWidth="1.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={k.icon} />
              </svg>
            </div>
            <div className="min-w-0">
              <p
                className="text-lg font-800 leading-none"
                style={{ color: k.color }}
              >
                {k.value}
              </p>
              <p className="text-[11px] font-500 text-gray-500 mt-1 truncate">
                {k.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Contenido */}
      <div className="flex-1 min-h-0 px-8 pb-8 flex flex-col">
        {/* Filtros */}
        <div className="shrink-0 pb-5 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[260px]">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Buscar por número o título"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-9 pr-4 py-2 rounded-full text-[13px] border bg-white w-full"
              style={{ borderColor: "#e8e8ed", outline: "none", width: "100%" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#005A7E")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e8e8ed")}
            />
          </div>
          <div className="relative shrink-0">
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setPage(1)
              }}
              className="appearance-none pl-4 pr-9 py-2 rounded-full text-[13px] border bg-white cursor-pointer"
              style={{
                borderColor: "#e8e8ed",
                outline: "none",
                color: "#1d1d1f",
              }}
            >
              <option value="all">Todos los estados</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="#6e6e73"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
          <div className="relative shrink-0">
            <select
              value={filterPriority}
              onChange={(e) => {
                setFilterPriority(e.target.value)
                setPage(1)
              }}
              className="appearance-none pl-4 pr-9 py-2 rounded-full text-[13px] border bg-white cursor-pointer"
              style={{
                borderColor: "#e8e8ed",
                outline: "none",
                color: "#1d1d1f",
              }}
            >
              <option value="all">Todas las prioridades</option>
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="#6e6e73"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {/* Grid de tickets */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch">
            {paginated.map((t) => {
              const sla = getSlaState(t, now)
              const rem = getSlaRemainingHours(t, now)
              const isRemitted = t.status === "Remitido a otra dependencia"
              const isResolved = t.status === "Resuelto"
              const isClosed = t.status === "Cerrado"
              const lightColor = isResolved
                ? "var(--ok-bright)"
                : sla === "expired"
                  ? "var(--danger-bright)"
                  : sla === "warning"
                    ? "var(--warn-bright)"
                    : sla === "ok"
                      ? "var(--ok-bright)"
                      : "#d2d2d7"
              const alertRing = isResolved
                ? "#0B750E"
                : sla === "expired"
                  ? "#E81312"
                  : sla === "warning"
                    ? "#E47113"
                    : null
              const slaAccent = isResolved
                ? "#a1a1a6"
                : sla === "expired"
                  ? "#ffffff"
                  : sla === "warning"
                    ? "var(--warn)"
                    : "#a1a1a6"
              const slaText =
                sla === "expired"
                  ? "SLA vencido"
                  : sla === "warning"
                    ? `Vence en ${formatSlaRemaining(rem ?? 0)}`
                    : rem !== null
                      ? `${formatSlaRemaining(rem)} restantes`
                      : slaTimeLabel(t.slaHours) === "Sin SLA"
                        ? "Sin SLA"
                        : `Meta ${slaTimeLabel(t.slaHours)}`
              const buttonLabel =
                isClosed || isResolved
                  ? "Ver detalle"
                  : t.status === "Asignado"
                    ? "Iniciar atención"
                    : "Resolver"
              const ageFactor =
                isResolved || isClosed
                  ? 0
                  : sla === "expired"
                    ? 1
                    : sla === "warning"
                      ? 0.5
                      : 0
              return (
                <div
                  key={t.id}
                  data-ticket-card
                  className="relative flex flex-col rounded-[18px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(0,0,0,0.08)] cursor-pointer"
                  style={{
                    background: "#ffffff",
                    border: `1.5px solid ${alertRing ?? "transparent"}`,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  }}
                  onClick={() => openPanel(t)}
                >
                  {/* Estado y fecha */}
                  <div className="flex items-center justify-between gap-2 px-4 pt-3">
                    <StatusBadge status={t.status} />
                    <span
                      className="text-[10px] shrink-0"
                      style={{ color: "#a1a1a6" }}
                    >
                      {t.priority !== "Sin asignar" ? `${t.priority} · ` : ""}
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
                    <span
                      className={`hidden md:inline-flex items-center gap-1 text-[10px] min-w-0 truncate${
                        sla === "expired"
                          ? " px-1.5 py-0.5 rounded-md font-semibold sla-pulse"
                          : sla === "warning"
                            ? " px-1.5 py-0.5 rounded-md font-medium"
                            : ""
                      }`}
                      style={{
                        color: slaAccent,
                        background:
                          sla === "expired"
                            ? "var(--danger-bright)"
                            : sla === "warning"
                              ? "rgba(228, 113, 19, 0.16)"
                              : "transparent",
                      }}
                    >
                      <svg
                        className="w-2.5 h-2.5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {slaText}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (t.status === "Asignado") handleStartWork(t)
                        else openPanel(t)
                      }}
                      className={`ml-auto shrink-0 w-28 py-1 rounded-full text-[11px] font-semibold transition-colors border inline-flex items-center justify-center gap-1 ${
                        isClosed || isResolved
                          ? "bg-surface border-line text-muted hover:bg-hover"
                          : t.status === "Asignado"
                            ? "bg-[#E47113] border-transparent hover:bg-[#c95f0e] active:bg-[#a84f0b] text-white"
                            : "bg-[#0A4159] border-transparent hover:bg-[#083349] active:bg-[#062a3c] text-white"
                      }`}
                    >
                      {buttonLabel}
                      {!isClosed && !isResolved && (
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
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  {ageFactor > 0 && (
                    <div
                      aria-hidden
                      className="absolute inset-0 rounded-[16px] pointer-events-none"
                      style={{
                        background: [
                          `repeating-linear-gradient(112deg, rgba(105,88,66,${0.03 * ageFactor}) 0px, rgba(255,255,255,0) 2px, rgba(105,88,66,${0.018 * ageFactor}) 4px, rgba(255,255,255,0) 7px)`,
                          `repeating-linear-gradient(24deg, rgba(120,100,78,${0.02 * ageFactor}) 0px, rgba(255,255,255,0) 6px, rgba(120,100,78,${0.012 * ageFactor}) 11px, rgba(255,255,255,0) 17px)`,
                          `radial-gradient(ellipse 55% 45% at 88% 8%, rgba(122,102,80,${0.07 * ageFactor}), transparent 70%)`,
                          `radial-gradient(ellipse 50% 40% at 10% 92%, rgba(115,96,75,${0.06 * ageFactor}), transparent 70%)`,
                          `radial-gradient(circle 1.6px at 22% 28%, rgba(92,82,64,${0.28 * ageFactor}), transparent)`,
                          `radial-gradient(circle 1.3px at 74% 68%, rgba(92,82,64,${0.24 * ageFactor}), transparent)`,
                          `radial-gradient(circle 1px at 52% 14%, rgba(92,82,64,${0.22 * ageFactor}), transparent)`,
                          `radial-gradient(circle 1.4px at 38% 84%, rgba(92,82,64,${0.2 * ageFactor}), transparent)`,
                        ].join(", "),
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>
          {sorted.length === 0 && (
            <div className="py-20 text-center">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                style={{ background: "#f1f5f9" }}
              >
                <svg
                  className="w-8 h-8 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-6.93 4 4 0 004 6.93zM16 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <p className="text-[13px]" style={{ color: "#a1a1a6" }}>
                No se encontraron tickets asignados con los filtros
                seleccionados.
              </p>
            </div>
          )}
        </div>
        {sorted.length > 0 && (
          <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs" style={{ color: "#86868b" }}>
                Mostrando {rangeStart}–{rangeEnd} de {sorted.length} tickets
              </span>
              {expiredCount > 0 && (
                <span
                  className="inline-flex items-center gap-1.5 text-[11px]"
                  style={{ color: "#A6141D" }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--danger-bright)" }}
                  />
                  {expiredCount} vencidos
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="w-8 h-8 rounded-full text-[13px] transition-colors disabled:opacity-30 hover:bg-black/5"
                style={{ color: "#1d1d1f" }}
              >
                ‹
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => {
                const active = p === currentPage
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className="relative w-8 h-8 rounded-full text-[13px] transition-colors hover:bg-black/5"
                    style={
                      active
                        ? { background: "#0A4159", color: "#ffffff" }
                        : { color: "#1d1d1f" }
                    }
                  >
                    {p}
                  </button>
                )
              })}
              <button
                onClick={() => setPage(Math.min(pageCount, currentPage + 1))}
                disabled={currentPage >= pageCount}
                className="w-8 h-8 rounded-full text-[13px] transition-colors disabled:opacity-30 hover:bg-black/5"
                style={{ color: "#1d1d1f" }}
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Panel lateral de gestión */}
      {panelOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/30" onClick={closePanel} />
          <div className="relative w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            {/* Cabecera */}
            <div
              className="px-5 py-4 border-b shrink-0"
              style={{
                background: "#005A7E",
                borderColor: "rgba(255,255,255,0.1)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white/60 text-xs font-600 tracking-wide">
                      {selectedTicket.number}
                    </span>
                  </div>
                  <p className="text-white font-700 text-sm mt-1 leading-snug line-clamp-2">
                    {selectedTicket.title}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-600"
                      style={{
                        background: "rgba(255,255,255,0.15)",
                        color: "white",
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: "#34AB1E" }}
                      />
                      {selectedTicket.status}
                    </span>
                    {selectedTicket.priority !== "Sin asignar" && (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-600"
                        style={{
                          background: "rgba(255,255,255,0.15)",
                          color: "white",
                        }}
                      >
                        {selectedTicket.priority}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-white/50">
                    <span>
                      Creado {formatDateTime(selectedTicket.createdAt)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={closePanel}
                  className="text-white/50 hover:text-white shrink-0 mt-0.5"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4 flex-1">
              {/* Seguimiento */}
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div
                  className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2"
                  style={{ background: "#f8fafc" }}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-xs font-600 text-gray-500 uppercase tracking-wide">
                    Seguimiento
                  </p>
                </div>
                <div className="p-4">
                  <StatusStepper
                    ticket={selectedTicket}
                    mode="timeline"
                    formatDateTime={formatDateTime}
                  />
                  {(() => {
                    const assignmentActivity = [...selectedTicket.activities]
                      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
                      .find(
                        (a) =>
                          a.action.toLowerCase().includes("asignad") && a.to,
                      )
                    if (assignmentActivity) {
                      return (
                        <div
                          className="mt-3 p-3 rounded-lg border border-[#e0f0f7]"
                          style={{ background: "#f0f8fc" }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="#005A7E"
                              strokeWidth="1.5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                              />
                            </svg>
                            <span
                              className="text-[11px] font-600"
                              style={{ color: "#005A7E" }}
                            >
                              Asignado por
                            </span>
                          </div>
                          <p className="text-[12px] font-600 text-gray-800">
                            {assignmentActivity.author}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {formatDateTime(assignmentActivity.timestamp)}
                          </p>
                        </div>
                      )
                    }
                    return null
                  })()}
                </div>
              </div>

              {/* Datos de la solicitud */}
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div
                  className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2"
                  style={{ background: "#f8fafc" }}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-xs font-600 text-gray-500 uppercase tracking-wide">
                    Solicitud
                  </p>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-700 shrink-0"
                      style={{ background: "#005A7E", color: "white" }}
                    >
                      {selectedTicket.user.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-600 text-gray-900 truncate">
                        {selectedTicket.user.name}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {selectedTicket.user.cargo} ·{" "}
                        {selectedTicket.user.dependencia}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-[11px]">
                    <div>
                      <span className="text-gray-400">Categoría</span>
                      <p className="font-500 text-gray-700 truncate">
                        {selectedTicket.category}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Subcategoría</span>
                      <p className="font-500 text-gray-700 truncate">
                        {selectedTicket.subcategory || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Tipo</span>
                      <p className="font-500 text-gray-700">
                        {selectedTicket.type}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Ubicación</span>
                      <p className="font-500 text-gray-700 truncate">
                        {selectedTicket.location || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Registrada</span>
                      <p className="font-500 text-gray-700">
                        {formatDate(selectedTicket.createdAt)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Contacto</span>
                      <p className="font-500 text-gray-700 truncate">
                        {selectedTicket.phone || "—"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 mb-1">
                      Descripción
                    </p>
                    <p
                      className="text-xs text-gray-600 leading-relaxed rounded-lg px-3 py-2 line-clamp-4"
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #f1f5f9",
                      }}
                    >
                      {selectedTicket.description}
                    </p>
                  </div>
                  {selectedTicket.attachments.length > 0 && (
                    <div>
                      <p className="text-[11px] text-gray-400 mb-1.5">
                        Adjuntos
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedTicket.attachments.map((a, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px]"
                            style={{ background: "#f0f8fc", color: "#005A7E" }}
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.172 7l-5 5 5 5m-5-5h5"
                              />
                            </svg>
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Escalar ticket */}
              {(selectedTicket.status === "En atención" ||
                selectedTicket.status === "Asignado") && (
                <div
                  className="rounded-xl border overflow-hidden"
                  style={{ borderColor: "#e2e8f0" }}
                >
                  {!showEscalate ? (
                    <button
                      type="button"
                      onClick={() => setShowEscalate(true)}
                      className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: "#fef0e4" }}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="#E47113"
                          strokeWidth="1.5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-600 text-gray-700">
                          Escalar a otro responsable
                        </p>
                        <p className="text-[11px] text-gray-400">
                          Transferir este ticket a otro responsable de soporte
                        </p>
                      </div>
                      <svg
                        className="w-4 h-4 text-gray-300 shrink-0 ml-auto"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.25 4.5l7.5 7.5-7.5 7.5"
                        />
                      </svg>
                    </button>
                  ) : (
                    <div
                      className="p-4 space-y-3"
                      style={{ background: "#fffcf5" }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: "#fef0e4" }}
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="#E47113"
                              strokeWidth="1.5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                              />
                            </svg>
                          </div>
                          <p className="text-[13px] font-600 text-gray-700">
                            Escalar ticket
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowEscalate(false)
                            setEscalateTo("")
                            setEscalateReason("")
                            setEscalateSearch("")
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>

                      <div>
                        <label className="block text-[11px] text-gray-500 mb-1">
                          Responsable Destino
                        </label>
                        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                          <div className="flex items-center gap-2 px-2.5 py-1.5 border-b border-gray-100">
                            <svg
                              className="w-3 h-3 text-gray-300 shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
                              />
                            </svg>
                            <input
                              type="text"
                              value={escalateSearch}
                              onChange={(e) =>
                                setEscalateSearch(e.target.value)
                              }
                              placeholder="Buscar responsable..."
                              className="w-full text-xs bg-transparent outline-none"
                            />
                          </div>
                          <div className="max-h-32 overflow-y-auto p-0.5">
                            {filteredEscalateTechs.length === 0 ? (
                              <p className="px-2.5 py-2 text-[11px] text-gray-400">
                                Sin resultados
                              </p>
                            ) : (
                              filteredEscalateTechs.map((name) => (
                                <button
                                  key={name}
                                  type="button"
                                  onClick={() => setEscalateTo(name)}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left text-xs transition-colors"
                                  style={{
                                    background:
                                      escalateTo === name
                                        ? "#e8f4f9"
                                        : "transparent",
                                    color:
                                      escalateTo === name
                                        ? "#005A7E"
                                        : "#334155",
                                  }}
                                >
                                  <div
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-700 shrink-0"
                                    style={{
                                      background:
                                        escalateTo === name
                                          ? "#005A7E"
                                          : "#e2e8f0",
                                      color:
                                        escalateTo === name
                                          ? "white"
                                          : "#94a3b8",
                                    }}
                                  >
                                    {name
                                      .split(" ")
                                      .map((w) => w[0])
                                      .join("")
                                      .slice(0, 2)}
                                  </div>
                                  {name}
                                  {escalateTo === name && (
                                    <svg
                                      className="w-3.5 h-3.5 ml-auto shrink-0"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="#005A7E"
                                      strokeWidth="2.5"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  )}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] text-gray-500 mb-1">
                          Motivo de escalación{" "}
                          <span className="text-gray-400">(opcional)</span>
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Describa por qué escaló este ticket..."
                          value={escalateReason}
                          onChange={(e) => setEscalateReason(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-xs border bg-white resize-none"
                          style={{ borderColor: "#e2e8f0", outline: "none" }}
                          onFocus={(e) =>
                            (e.currentTarget.style.borderColor = "#E47113")
                          }
                          onBlur={(e) =>
                            (e.currentTarget.style.borderColor = "#e2e8f0")
                          }
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleEscalate}
                        disabled={!escalateTo.trim()}
                        className="w-full py-2.5 rounded-lg text-sm font-600 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          background: escalateTo.trim() ? "#E47113" : "#b6c7d2",
                        }}
                      >
                        Escalar ticket
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Pasos de diagnóstico */}
              {selectedTicket.status === "En atención" && !showEscalate && (
                <div
                  className="rounded-xl border overflow-hidden"
                  style={{ borderColor: "#e2e8f0" }}
                >
                  <div
                    className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between"
                    style={{ background: "#f8fafc" }}
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                        />
                      </svg>
                      <p className="text-xs font-600 text-gray-500 uppercase tracking-wide">
                        Pasos de diagnóstico
                      </p>
                    </div>
                    {stepsTotal > 0 && (
                      <span
                        className="text-[11px] font-600"
                        style={{ color: "#005A7E" }}
                      >
                        {stepsTotal} {stepsTotal === 1 ? "paso" : "pasos"}
                      </span>
                    )}
                  </div>

                  {stepsTotal > 0 && (
                    <div className="px-4 pt-3">
                      <div
                        className="relative w-full rounded-full overflow-hidden"
                        style={{ height: 5, background: "#e2e8f0" }}
                      >
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                          style={{
                            width: "100%",
                            background:
                              "linear-gradient(90deg, #34AB1E, #2d9a16)",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="p-4 space-y-2">
                    {solutionSteps.length === 0 && (
                      <div className="flex flex-col items-center py-6 gap-3">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ background: "#e8f4f9" }}
                        >
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="#005A7E"
                            strokeWidth="1.2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-600 text-gray-500">
                            Sin pasos registrados
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Agregue cada paso que realiza para diagnosticar el
                            ticket.
                          </p>
                        </div>
                      </div>
                    )}

                    {solutionSteps.map((step, idx) => {
                      const isActive = step.id === activeStepId
                      return (
                        <div
                          key={step.id}
                          className="group rounded-xl border transition-all duration-200 cursor-pointer"
                          style={{
                            borderColor: isActive ? "#005A7E" : "#e2e8f0",
                            background: isActive ? "#f0f8fc" : "white",
                            boxShadow: isActive
                              ? "0 1px 3px rgba(0,90,126,0.15)"
                              : "0 1px 2px rgba(0,0,0,0.04)",
                          }}
                        >
                          <div className="flex items-start gap-3 px-3.5 py-3">
                            <span
                              className="text-[11px] font-700 shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                              style={{
                                background: isActive ? "#005A7E" : "#94a3b8",
                                color: "white",
                              }}
                            >
                              {idx + 1}
                            </span>
                            <div
                              className="flex-1 min-w-0"
                              onClick={() =>
                                setActiveStepId(isActive ? null : step.id)
                              }
                            >
                              {isActive ? (
                                <input
                                  type="text"
                                  value={step.description}
                                  onChange={(e) =>
                                    setStepDescription(step.id, e.target.value)
                                  }
                                  onBlur={() => setActiveStepId(null)}
                                  autoFocus
                                  className="w-full px-2 py-0.5 rounded text-[13px] font-500 bg-white border"
                                  style={{
                                    borderColor: "#005A7E",
                                    outline: "none",
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <p
                                  className="text-[13px] font-500 leading-snug py-0.5"
                                  style={{ color: "#1e293b" }}
                                >
                                  {step.description}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeStep(step.id)}
                              className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5"
                              title="Eliminar paso"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="px-4 pb-4">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder="Describa el paso que realizó..."
                          value={customStepInput}
                          onChange={(e) => setCustomStepInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              addCustomStep()
                            }
                          }}
                          className="w-full pl-3 pr-9 py-2.5 rounded-xl text-sm border bg-white"
                          style={{ borderColor: "#e2e8f0", outline: "none" }}
                          onFocus={(e) =>
                            (e.currentTarget.style.borderColor = "#005A7E")
                          }
                          onBlur={(e) =>
                            (e.currentTarget.style.borderColor = "#e2e8f0")
                          }
                        />
                        {customStepInput.trim() ? (
                          <button
                            type="button"
                            onClick={addCustomStep}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all"
                            style={{ background: "#005A7E", color: "white" }}
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 6v12m6-6H6"
                              />
                            </svg>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={addCustomStep}
                            disabled
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all opacity-30 cursor-not-allowed"
                            style={{ background: "#cbd5e1", color: "white" }}
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 6v12m6-6H6"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Solución */}
              {selectedTicket.status === "En atención" && !showEscalate && (
                <div
                  className="rounded-xl border p-4"
                  style={{ borderColor: "#c7e3b1", background: "#f3faed" }}
                >
                  <label
                    className="block text-[11px] font-600 uppercase tracking-wide mb-1.5"
                    style={{ color: "#1e6614" }}
                  >
                    Mensaje que se enviará al solicitante *
                  </label>
                  <p className="text-[11px] text-gray-500 mb-2">
                    Obligatorio. Este mensaje se remite al usuario indicando que
                    el ticket quedó resuelto.
                  </p>
                  <div
                    ref={messageRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={syncMessageFromHtml}
                    data-placeholder="Redacte el mensaje que recibirá el solicitante informándole que su solicitud fue resuelta..."
                    className="message-editor w-full px-3 py-2.5 rounded-lg text-[13px] leading-relaxed text-gray-700 bg-white min-h-[160px] border"
                    style={{
                      borderColor: solutionMessage.trim()
                        ? "#c7e3b1"
                        : "#e2e8f0",
                      outline: "none",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "#34AB1E")
                    }
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = solutionMessage.trim()
                        ? "#c7e3b1"
                        : "#e2e8f0"
                      syncMessageFromHtml()
                    }}
                  />
                </div>
              )}

              {/* Evidencia */}
              {selectedTicket.status === "En atención" && !showEscalate && (
                <div>
                  <label className="block text-[11px] font-600 text-gray-500 uppercase tracking-wide mb-1.5">
                    Evidencia{" "}
                    <span className="text-gray-400 normal-case">
                      (opcional)
                    </span>
                  </label>
                  <div
                    className="h-14 rounded-xl px-4 flex items-center justify-center gap-3 cursor-pointer transition-colors"
                    style={{
                      border: "1.5px dashed",
                      borderColor: evidenceDragOver ? "#34AB1E" : "#cbd5e1",
                      background: evidenceDragOver ? "#f3faed" : "transparent",
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setEvidenceDragOver(true)
                    }}
                    onDragLeave={() => setEvidenceDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setEvidenceDragOver(false)
                      addEvidence(e.dataTransfer.files)
                    }}
                    onClick={() => evidenceInputRef.current?.click()}
                  >
                    <svg
                      className="w-4 h-4 text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    <p className="text-xs text-gray-500">
                      Arrastre imágenes o{" "}
                      <span className="font-500" style={{ color: "#1e6614" }}>
                        selecciónelas
                      </span>{" "}
                      <span className="text-gray-400">
                        (PNG, JPG, JPEG, GIF, WEBP, SVG)
                      </span>
                    </p>
                    <input
                      ref={evidenceInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        addEvidence(e.target.files)
                        e.target.value = ""
                      }}
                    />
                  </div>
                  {evidenceError && (
                    <p
                      className="mt-1.5 text-[11px]"
                      style={{ color: "#A6141D" }}
                    >
                      {evidenceError}
                    </p>
                  )}
                  {evidenceFiles.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {evidenceFiles.map((f, i) => (
                        <span
                          key={`${f.name}_${i}`}
                          className="inline-flex items-center gap-1 pl-2 pr-1.5 py-0.5 rounded text-[11px]"
                          style={{ background: "#f3faed", color: "#1e6614" }}
                        >
                          {f.name}
                          <button
                            type="button"
                            onClick={() =>
                              setEvidenceFiles((prev) =>
                                prev.filter((_, j) => j !== i),
                              )
                            }
                            className="hover:text-gray-600 ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Diagnóstico existente (solo lectura) */}
              {selectedTicket.solutionStages &&
                selectedTicket.solutionStages.length > 0 && (
                  <div
                    className="rounded-xl border border-gray-200 p-4"
                    style={{ background: "#f8fafc" }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-600 text-gray-500 uppercase tracking-wide">
                        Diagnóstico del responsable
                      </p>
                      <span
                        className="text-[11px] font-600"
                        style={{ color: "#005A7E" }}
                      >
                        {
                          selectedTicket.solutionStages.filter((s) => s.done)
                            .length
                        }
                        /{selectedTicket.solutionStages.length} pasos
                        completados
                      </span>
                    </div>
                    <div>
                      <p className="text-[11px] font-600 text-gray-400 uppercase mb-2">
                        Pasos de diagnóstico
                      </p>
                      <div className="space-y-1.5">
                        {selectedTicket.solutionStages.map((stage) => (
                          <div
                            key={stage.id}
                            className="flex items-center gap-2 text-xs"
                          >
                            <span
                              className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                              style={{
                                background: stage.done ? "#dcfce7" : "#f1f5f9",
                                color: stage.done ? "#166534" : "#94a3b8",
                              }}
                            >
                              {stage.done ? "✓" : "○"}
                            </span>
                            <span
                              style={{
                                color: stage.done ? "#374151" : "#94a3b8",
                              }}
                            >
                              {stage.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
            </div>

            {/* Botones de acción */}
            {canResolve(selectedTicket) && (
              <div className="p-5 border-t border-gray-100 flex flex-col gap-2 shrink-0">
                <div className="flex gap-2">
                  <button
                    onClick={closePanel}
                    className="flex-1 py-2.5 rounded-lg text-sm font-600 border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  {selectedTicket.status === "Asignado" ? (
                    <button
                      onClick={() => handleStartWork(selectedTicket)}
                      className="flex-1 py-2.5 rounded-lg text-sm font-600 text-white hover:opacity-90 transition-all"
                      style={{ background: "#E47113" }}
                    >
                      Iniciar atención
                    </button>
                  ) : (
                    <button
                      onClick={handleResolve}
                      disabled={
                        !solutionMessage.trim() || solutionSteps.length === 0
                      }
                      className="flex-1 py-2.5 rounded-lg text-sm font-600 text-white hover:opacity-90 disabled:cursor-not-allowed transition-all"
                      style={{
                        background:
                          !solutionMessage.trim() || solutionSteps.length === 0
                            ? "#b6c7d2"
                            : "#34AB1E",
                      }}
                    >
                      Registrar solución
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
