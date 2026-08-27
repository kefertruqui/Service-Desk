import { useState, useEffect, useRef } from "react"
import type {
  Ticket,
  View,
  TicketStatus,
  TicketType,
  TicketPriority,
  UserInfo,
  AdminNotification,
} from "../types"
import { StatusBadge, PriorityBadge } from "./StatusBadge"
import { StatusStepper } from "./StatusStepper"
import { mockNotifications } from "../data/mockData"
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

const technicians = [
  "Juan Claros",
  "Danny Marles",
  "Fabio Torres",
  "Stella Suarez",
  "Json Garcia",
]
const statusOptions: TicketStatus[] = [
  "Registrado",
  "Clasificado",
  "Asignado",
  "En atención",
  "Resuelto",
  "Cerrado",
  "Remitido a otra dependencia",
]
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
const typeOptions: TicketType[] = [
  "Sin Clasificar",
  "Incidente",
  "Solicitud",
  "Problema",
]
const priorities: TicketPriority[] = ["Crítica", "Alta", "Media", "Baja"]

const relTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "ahora"
  if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h} h`
  return `hace ${Math.floor(h / 24)} d`
}

export default function AdminDashboard({
  tickets,
  onNavigate,
  onUpdateTicket,
  user,
}: Props) {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [assignees, setAssignees] = useState<string[]>([])
  const [assigneeSearch, setAssigneeSearch] = useState("")
  const [newType, setNewType] = useState<TicketType>("Sin Clasificar")
  const [newPriority, setNewPriority] = useState<TicketPriority>("Sin asignar")
  const [internalNote, setInternalNote] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [filterAssignee, setFilterAssignee] = useState("all")
  const [filterRated, setFilterRated] = useState("all")
  const [filterOpen, setFilterOpen] = useState(false)
  const uniqueAssignees = [
    ...new Set(
      tickets
        .map((t) => t.technician)
        .filter(Boolean)
        .flatMap((t) => t!.split(",").map((s) => s.trim())),
    ),
  ].sort()
  const hasActiveFilters =
    filterAssignee !== "all" ||
    filterRated !== "all" ||
    filterDateFrom ||
    filterDateTo
  const activeFilterCount = [
    filterAssignee !== "all",
    filterRated !== "all",
    !!filterDateFrom,
    !!filterDateTo,
  ].filter(Boolean).length
  const filterRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!filterOpen) return
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node))
        setFilterOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [filterOpen])
  const [search, setSearch] = useState("")
  const [notifOpen, setNotifOpen] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [remitChecked, setRemitChecked] = useState(false)
  const [remitOpen, setRemitOpen] = useState(false)
  const [remitEmail, setRemitEmail] = useState("")
  const [remitMessage, setRemitMessage] = useState("")
  const [remitMessageTouched, setRemitMessageTouched] = useState(false)

  const now = Date.now()

  const overdueTickets = tickets.filter(
    (t) => getSlaState(t, now) === "warning",
  )
  const expiredTickets = tickets.filter(
    (t) => getSlaState(t, now) === "expired",
  )

  const dynamicNotifs: AdminNotification[] = [
    ...expiredTickets.map((t) => ({
      id: `slae-${t.id}`,
      type: "sla-expired" as const,
      title: "SLA vencido",
      message: `${t.number} · ${t.title} venció su tiempo de resolución. Requiere atención inmediata.`,
      ticketId: t.id,
      ticketNumber: t.number,
      timestamp: new Date().toISOString(),
      read: false,
    })),
    ...overdueTickets.map((t) => ({
      id: `slaw-${t.id}`,
      type: "sla-warning" as const,
      title: "Por vencer",
      message: `${t.number} · ${t.title} está por vencer.`,
      ticketId: t.id,
      ticketNumber: t.number,
      timestamp: new Date().toISOString(),
      read: false,
    })),
  ]
  const notifications = [...mockNotifications, ...dynamicNotifs].sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp),
  )
  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length

  const msFrom = filterDateFrom
    ? new Date(filterDateFrom + "T00:00:00").getTime()
    : null
  const msTo = filterDateTo
    ? new Date(filterDateTo + "T23:59:59.999").getTime()
    : null
  const filtered = tickets.filter((t) => {
    const ms =
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.number.toLowerCase().includes(search.toLowerCase())
    const mst = filterStatus === "all" || t.status === filterStatus
    const mp = filterPriority === "all" || t.priority === filterPriority
    const mt = filterType === "all" || t.type === filterType
    const created = new Date(t.createdAt).getTime()
    const md =
      (msFrom === null || created >= msFrom) &&
      (msTo === null || created <= msTo)
    const ma =
      filterAssignee === "all" ||
      (filterAssignee === "none"
        ? !t.technician
        : (t.technician ?? "").includes(filterAssignee))
    const mr =
      filterRated === "all" ||
      (filterRated === "rated" ? t.rating != null : t.rating == null)
    return ms && mst && mp && mt && md && ma && mr
  })

  /* Orden estratégico de la cola:
     0 · Recién llegados (Registrado): siempre primero para su revisión
     1 · Vencidos (semáforo rojo)
     2 · Por vencer (semáforo amarillo)
     3 · Clasificados | 4 · Asignados | 5 · En atención (orden del flujo)
     6 · Resueltos | 7 · Cerrados | 8 · Remitidos */
  const queueRank = (t: Ticket): number => {
    if (t.status === "Registrado") return 0
    const s = getSlaState(t, now)
    if (s === "expired") return 1
    if (s === "warning") return 2
    if (t.status === "Clasificado") return 3
    if (t.status === "Asignado") return 4
    if (t.status === "En atención") return 5
    if (t.status === "Resuelto") return 6
    if (t.status === "Cerrado") return 7
    if (t.status === "Remitido a otra dependencia") return 8
    return 3
  }

  const sorted = [...filtered].sort((a, b) => {
    const ra = queueRank(a)
    const rb = queueRank(b)
    if (ra !== rb) return ra - rb
    if (ra === 1 || ra === 2) {
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

  const openPanel = (t: Ticket) => {
    setSelectedTicket(t)
    setAssignees(
      t.technician
        ? t.technician
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    )
    setAssigneeSearch("")
    setNewType(t.type)
    setNewPriority(t.priority)
    setRemitChecked(false)
    setRemitEmail("")
    setRemitMessageTouched(false)
    setPanelOpen(true)
  }

  const remitDefaultMessage = (email: string) =>
    `Estimado(a) ${selectedTicket?.user.name ?? ""}:\n\nSu solicitud fue remitida a la dependencia responsable (${email || "correo por confirmar"}) para su atención. La OATI le estará informando cualquier novedad.`

  const closeTicket = (t: Ticket) => {
    onUpdateTicket?.(t.id, {
      status: "Cerrado",
      activities: [
        ...t.activities,
        {
          id: `a-${Date.now()}-c`,
          action: "Ticket cerrado",
          author: user?.name ?? "Administrador",
          timestamp: new Date().toISOString(),
          from: t.status,
          to: "Cerrado",
        },
      ],
    })
  }

  const toggleRemit = (checked: boolean) => {
    setRemitChecked(checked)
    if (checked) {
      setRemitEmail("")
      setRemitMessageTouched(false)
      setRemitMessage(remitDefaultMessage(""))
      setRemitOpen(true)
    } else {
      setRemitEmail("")
      setRemitMessageTouched(false)
    }
  }

  const toggleAssignee = (name: string) => {
    setAssignees((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    )
  }

  const isClassified = newType !== "Sin Clasificar"
  const isUnclassifiedTicket = selectedTicket?.type === "Sin Clasificar"
  const hasAssignee = assignees.length > 0
  const filteredTechnicians = technicians.filter((t) =>
    t.toLowerCase().includes(assigneeSearch.trim().toLowerCase()),
  )
  const canSave = remitChecked
    ? remitEmail.trim() !== ""
    : isUnclassifiedTicket
      ? newType !== "Sin Clasificar" && newPriority !== "Sin asignar"
      : isClassified
  const cannotSaveHint = remitChecked
    ? remitEmail.trim() === ""
      ? "Complete el correo de destino para habilitar la remisión."
      : ""
    : isUnclassifiedTicket
      ? newType === "Sin Clasificar" || newPriority === "Sin asignar"
        ? "Seleccione el tipo y la prioridad de la solicitud para habilitar la clasificación."
        : ""
      : !isClassified
        ? "Debe clasificar el tipo de solicitud (Incidente, Solicitud o Problema) antes de asignar técnico o avanzar de estado."
        : newPriority === "Sin asignar"
          ? "Debe definir la prioridad para armar el SLA. La prioridad se escoge junto con la clasificación."
          : ""

  const saveChanges = () => {
    if (!selectedTicket || !canSave) return
    const status = remitChecked
      ? "Remitido a otra dependencia"
      : !isClassified
        ? "Registrado"
        : hasAssignee && flowIdx(selectedTicket.status) < flowIdx("Asignado")
          ? "Asignado"
          : !hasAssignee &&
              flowIdx(selectedTicket.status) <= flowIdx("Clasificado")
            ? "Clasificado"
            : selectedTicket.status
    const updates: Partial<Ticket> = {
      status,
      technician: assignees.join(", "),
      type: remitChecked ? selectedTicket.type : newType,
      priority: remitChecked ? selectedTicket.priority : newPriority,
      slaHours: remitChecked
        ? selectedTicket.slaHours
        : SLA_HOURS_BY_PRIORITY[newPriority],
      ...(remitChecked && remitEmail.trim()
        ? { remittedEmail: remitEmail.trim() }
        : {}),
    }
    if (
      slaRunningStatuses.includes(status) &&
      selectedTicket.slaStartedAt === undefined &&
      !remitChecked
    ) {
      updates.slaStartedAt = new Date().toISOString()
    }
    if (internalNote.trim()) {
      updates.comments = [
        ...selectedTicket.comments,
        {
          id: `c-${Date.now()}`,
          author: user?.name ?? "Administrador",
          role: "Mesa de Servicios",
          content: internalNote.trim(),
          timestamp: new Date().toISOString(),
          isInternal: true,
        },
      ]
    }
    const newActivities = [...selectedTicket.activities]
    if (remitChecked) {
      updates.comments = [
        ...(updates.comments ?? selectedTicket.comments),
        {
          id: `c-${Date.now()}-r`,
          author: "Mesa de Servicios OATI",
          role: "Mesa de Servicios",
          content: remitMessage.trim() || remitDefaultMessage(remitEmail),
          timestamp: new Date().toISOString(),
          isInternal: false,
        },
      ]
      newActivities.push({
        id: `a-${Date.now()}-r`,
        action: `Solicitud remitida a ${remitEmail}`,
        author: user?.name ?? "Administrador",
        timestamp: new Date().toISOString(),
        to: remitEmail,
      })
    }
    if (newType !== selectedTicket.type && !remitChecked) {
      newActivities.push({
        id: `a-${Date.now()}`,
        action:
          newType === "Sin Clasificar"
            ? "Clasificación revertida"
            : `Solicitud clasificada como ${newType}`,
        author: user?.name ?? "Administrador",
        timestamp: new Date().toISOString(),
        from: selectedTicket.type,
        to: newType,
      })
    }
    if (newPriority !== selectedTicket.priority && !remitChecked) {
      newActivities.push({
        id: `a-${Date.now()}-p`,
        action: `Prioridad establecida como ${newPriority} · SLA ${slaTimeLabel(SLA_HOURS_BY_PRIORITY[newPriority])}`,
        author: user?.name ?? "Administrador",
        timestamp: new Date().toISOString(),
        from: selectedTicket.priority,
        to: newPriority,
      })
    }
    if (
      assignees.length > 0 &&
      assignees.join(", ") !== selectedTicket.technician
    ) {
      newActivities.push({
        id: `a-${Date.now()}-t`,
        action:
          assignees.length > 1
            ? "Responsables asignados"
            : "Responsable asignado",
        author: user?.name ?? "Administrador",
        timestamp: new Date().toISOString(),
        to: assignees.join(", "),
      })
    }
    if (status !== selectedTicket.status) {
      newActivities.push({
        id: `a-${Date.now()}-s`,
        action: "Estado cambiado",
        author: user?.name ?? "Administrador",
        timestamp: new Date().toISOString(),
        from: selectedTicket.status,
        to: status,
      })
    }
    if (newActivities.length !== selectedTicket.activities.length) {
      updates.activities = newActivities
    }
    onUpdateTicket?.(selectedTicket.id, updates)
    if (isUnclassifiedTicket && !remitChecked) {
      setSelectedTicket({
        ...selectedTicket,
        ...updates,
        comments: updates.comments ?? selectedTicket.comments,
        activities: updates.activities ?? selectedTicket.activities,
      })
    } else {
      setPanelOpen(false)
    }
  }

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

  const ticketAge = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return "Recién creado"
    if (hours < 24) return `${hours}h de vida`
    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h de vida`
  }

  const notifIcon = (n: AdminNotification) => {
    const cfg =
      n.type === "sla-expired"
        ? {
            bg: "#fce8e9",
            color: "#A6141D",
            path: "M12 9v3m0 0v3m0-3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
          }
        : n.type === "sla-warning"
          ? {
              bg: "#fef0e4",
              color: "#E47113",
              path: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
            }
          : n.type === "new-ticket"
            ? { bg: "#e8f4f9", color: "#005A7E", path: "M12 4v16m8-8H4" }
            : {
                bg: "#f1f5f9",
                color: "#64748b",
                path: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
              }
    return (
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: cfg.bg }}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke={cfg.color}
          strokeWidth="1.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={cfg.path} />
        </svg>
      </div>
    )
  }

  const exportReport = () => {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`
    const header = [
      "Número",
      "Título",
      "Tipo",
      "Estado",
      "Prioridad",
      "Solicitante",
      "Responsable",
      "Categoría",
      "Subcategoría",
      "Fecha de creación",
      "SLA (horas)",
      "Ubicación",
    ]
    const rows = sorted.map((t) => [
      t.number,
      t.title,
      t.type,
      t.status,
      t.priority,
      t.user.name,
      t.technician ?? "",
      t.category,
      t.subcategory,
      new Date(t.createdAt).toLocaleString("es-CO"),
      t.slaHours || "",
      t.location,
    ])
    const csv =
      "\uFEFF" + [header, ...rows].map((r) => r.map(esc).join(";")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reporte-tickets-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Encabezado */}
      <div className="shrink-0 px-8 pt-8 pb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2
            className="text-[26px] leading-tight font-semibold whitespace-nowrap"
            style={{ color: "#005A7E", letterSpacing: "-0.02em" }}
          >
            Panel de Administración{" "}
            <span
              className="font-normal whitespace-nowrap"
              style={{ color: "#86868b" }}
            >
              - Service Desk
            </span>
          </h2>
        </div>

        {/* Notifications bell */}
        <div className="relative shrink-0">
          <button
            onClick={() => {
              setNotifOpen((o) => !o)
              setReadIds(new Set(notifications.map((n) => n.id)))
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{
              background: notifOpen ? "#ececf0" : "#ffffff",
              border: "1.5px solid #005A7E",
              color: "#6e6e73",
            }}
          >
            <svg
              className="w-[18px] h-[18px]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full text-[9px] font-semibold text-white flex items-center justify-center"
                style={{
                  background: "var(--danger-bright)",
                  boxShadow: "0 0 0 2px #f5f5f7",
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-12 w-96 max-h-96 overflow-y-auto bg-white rounded-2xl border border-gray-100 shadow-xl z-30">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p
                  className="text-sm font-semibold"
                  style={{ color: "#1d1d1f" }}
                >
                  Notificaciones
                </p>
                <span className="text-xs" style={{ color: "#86868b" }}>
                  {notifications.length}
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() =>
                      n.ticketId &&
                      openPanel(tickets.find((t) => t.id === n.ticketId)!)
                    }
                    className="w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors"
                    style={{
                      background: readIds.has(n.id) ? "white" : "#f5f5f7",
                    }}
                  >
                    {notifIcon(n)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className="text-xs font-semibold"
                          style={{ color: "#1d1d1f" }}
                        >
                          {n.title}
                        </p>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {relTime(n.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 min-h-0 px-8 pb-8 flex flex-col">
        {/* Filtros */}
        <div className="shrink-0 pb-5 flex flex-wrap items-center gap-2">
          <div className="flex gap-2 items-center w-full">
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
                placeholder="Buscar por número, título o solicitante"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-full text-[13px] border bg-white w-full"
                style={{
                  borderColor: "#e8e8ed",
                  outline: "none",
                  width: "100%",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#005A7E")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e8e8ed")}
              />
            </div>
            <div className="relative shrink-0">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
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
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="appearance-none pl-4 pr-9 py-2 rounded-full text-[13px] border bg-white cursor-pointer"
                style={{
                  borderColor: "#e8e8ed",
                  outline: "none",
                  color: "#1d1d1f",
                }}
              >
                <option value="all">Todos los tipos</option>
                {typeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
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
                onChange={(e) => setFilterPriority(e.target.value)}
                className="appearance-none pl-4 pr-9 py-2 rounded-full text-[13px] border bg-white cursor-pointer"
                style={{
                  borderColor: "#e8e8ed",
                  outline: "none",
                  color: "#1d1d1f",
                }}
              >
                <option value="all">Todas las prioridades</option>
                <option value="Sin asignar">Sin asignar</option>
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
            <div ref={filterRef} className="relative shrink-0">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] border bg-white transition-colors cursor-pointer"
                style={{
                  borderColor: hasActiveFilters ? "#005A7E" : "#e8e8ed",
                  background: hasActiveFilters ? "#e8f4f9" : "white",
                  outline: "none",
                  color: hasActiveFilters ? "#005A7E" : "#1d1d1f",
                }}
                title="Más filtros"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
                  />
                </svg>
                Filtros
                {hasActiveFilters && (
                  <span
                    className="w-4 h-4 rounded-full text-[9px] font-700 flex items-center justify-center"
                    style={{ background: "#005A7E", color: "white" }}
                  >
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {filterOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-gray-100 shadow-xl z-30 p-4 flex flex-col gap-4">
                  <div>
                    <label
                      className="text-[11px] font-600 block mb-1.5"
                      style={{ color: "#86868b" }}
                    >
                      Responsable
                    </label>
                    <select
                      value={filterAssignee}
                      onChange={(e) => setFilterAssignee(e.target.value)}
                      className="w-full pl-3 pr-8 py-1.5 rounded-lg text-[13px] border bg-white cursor-pointer"
                      style={{
                        borderColor: "#e8e8ed",
                        outline: "none",
                        color: "#1d1d1f",
                      }}
                    >
                      <option value="all">Todos</option>
                      <option value="none">Sin responsable</option>
                      {uniqueAssignees.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      className="text-[11px] font-600 block mb-1.5"
                      style={{ color: "#86868b" }}
                    >
                      Calificación
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFilterRated("all")}
                        className="flex-1 py-1.5 rounded-lg text-[12px] font-600 border transition-colors cursor-pointer"
                        style={{
                          borderColor:
                            filterRated === "all" ? "#005A7E" : "#e8e8ed",
                          background:
                            filterRated === "all" ? "#e8f4f9" : "white",
                          color: filterRated === "all" ? "#005A7E" : "#86868b",
                        }}
                      >
                        Todos
                      </button>
                      <button
                        onClick={() => setFilterRated("rated")}
                        className="flex-1 py-1.5 rounded-lg text-[12px] font-600 border transition-colors cursor-pointer inline-flex items-center justify-center gap-1"
                        style={{
                          borderColor:
                            filterRated === "rated" ? "#f5b301" : "#e8e8ed",
                          background:
                            filterRated === "rated" ? "#fdf5e0" : "white",
                          color:
                            filterRated === "rated" ? "#92610a" : "#86868b",
                        }}
                      >
                        <svg
                          className="w-3 h-3"
                          viewBox="0 0 24 24"
                          fill={filterRated === "rated" ? "#f5b301" : "none"}
                          stroke={
                            filterRated === "rated" ? "#f5b301" : "#86868b"
                          }
                          strokeWidth="1.5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                          />
                        </svg>
                        Calificados
                      </button>
                    </div>
                  </div>
                  <div>
                    <label
                      className="text-[11px] font-600 block mb-1.5"
                      style={{ color: "#86868b" }}
                    >
                      Rango de fechas
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={filterDateFrom}
                        onChange={(e) => setFilterDateFrom(e.target.value)}
                        max={filterDateTo || undefined}
                        className="flex-1 pl-2 pr-1 py-1.5 rounded-lg text-[12px] border bg-white cursor-pointer"
                        style={{
                          borderColor: "#e8e8ed",
                          outline: "none",
                          color: "#1d1d1f",
                        }}
                      />
                      <span style={{ color: "#c7c7cc" }}>–</span>
                      <input
                        type="date"
                        value={filterDateTo}
                        onChange={(e) => setFilterDateTo(e.target.value)}
                        min={filterDateFrom || undefined}
                        className="flex-1 pl-2 pr-1 py-1.5 rounded-lg text-[12px] border bg-white cursor-pointer"
                        style={{
                          borderColor: "#e8e8ed",
                          outline: "none",
                          color: "#1d1d1f",
                        }}
                      />
                    </div>
                  </div>
                  {hasActiveFilters && (
                    <button
                      onClick={() => {
                        setFilterAssignee("all")
                        setFilterRated("all")
                        setFilterDateFrom("")
                        setFilterDateTo("")
                      }}
                      className="text-[11px] font-600 text-center py-1.5 rounded-lg border cursor-pointer transition-colors"
                      style={{ borderColor: "#e8e8ed", color: "#86868b" }}
                    >
                      Limpiar filtros adicionales
                    </button>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={exportReport}
              title="Descargar reporte de tickets"
              aria-label="Descargar reporte de tickets"
              className="ml-auto shrink-0 px-3.5 py-2 rounded-full text-[13px] font-medium border bg-white transition-colors flex items-center gap-1.5 hover:bg-[#e8f4f9]"
              style={{
                borderColor: "#005A7E",
                outline: "none",
                color: "#005A7E",
              }}
            >
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
              Reporte
            </button>
          </div>
        </div>
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
                : isRemitted
                  ? "#c7c7cc"
                  : sla === "expired"
                    ? "var(--danger-bright)"
                    : sla === "warning"
                      ? "var(--warn-bright)"
                      : sla === "ok"
                        ? "var(--ok-bright)"
                        : "#d2d2d7"
              const alertRing = isResolved
                ? "#0B750E"
                : !isRemitted && sla === "expired"
                  ? "#E81312"
                  : !isRemitted && sla === "warning"
                    ? "#E47113"
                    : null
              const slaAccent =
                isRemitted || isResolved
                  ? "#a1a1a6"
                  : sla === "expired"
                    ? "#ffffff"
                    : sla === "warning"
                      ? "var(--warn)"
                      : "#a1a1a6"
              const slaText = isRemitted
                ? "Sin clasificación"
                : !isRemitted && sla === "expired"
                  ? "SLA vencido"
                  : !isRemitted && sla === "warning"
                    ? `Vence en ${formatSlaRemaining(rem ?? 0)}`
                    : rem !== null
                      ? `${formatSlaRemaining(rem)} restantes`
                      : slaTimeLabel(t.slaHours) === "Sin SLA"
                        ? "Sin SLA"
                        : `Meta ${slaTimeLabel(t.slaHours)}`
              const buttonLabel = isRemitted
                ? "Ver detalle"
                : isClosed || isResolved
                  ? "Ver detalle"
                  : t.type === "Sin Clasificar"
                    ? "Clasificar"
                    : "Gestionar"
              const techColor =
                isRemitted || isClosed
                  ? "#86868b"
                  : isResolved
                    ? "var(--ok)"
                    : sla === "expired"
                      ? "var(--danger)"
                      : sla === "warning"
                        ? "#E47113"
                        : "#005A7E"
              const ageFactor =
                isResolved || isClosed || isRemitted
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
                      {t.status !== "Remitido a otra dependencia" &&
                      t.priority !== "Sin asignar"
                        ? `${t.priority} · `
                        : ""}
                      {formatDate(t.createdAt)}
                    </span>
                  </div>

                  {/* Mini-stepper del ciclo de vida */}
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
                    {t.technician && (
                      <div
                        className="flex items-center gap-1.5 mt-1 text-[11px] font-medium min-w-0"
                        style={{ color: techColor }}
                      >
                        <svg
                          className="w-3 h-3 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="truncate">
                          Responsable: {t.technician}
                        </span>
                      </div>
                    )}
                    {isRemitted && (t.remittedEmail || t.assignedTo) && (
                      <div
                        className="flex items-center gap-1.5 mt-1 text-[11px] min-w-0"
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
                            d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                          />
                        </svg>
                        <span className="truncate">
                          {t.remittedEmail ?? t.assignedTo}
                        </span>
                      </div>
                    )}
                    {isClosed && (
                      <div className="flex items-center gap-0.5 mt-1.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <svg
                            key={i}
                            className="w-3 h-3"
                            viewBox="0 0 24 24"
                            fill={i <= (t.rating ?? 0) ? "#FACC15" : "none"}
                            stroke={
                              i <= (t.rating ?? 0) ? "#FACC15" : "#c7c7cc"
                            }
                            strokeWidth="1.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            />
                          </svg>
                        ))}
                        {t.rating ? (
                          <span
                            className="text-[10px] ml-1 font-medium"
                            style={{ color: "#86868b" }}
                          >
                            {t.rating}/5
                          </span>
                        ) : null}
                      </div>
                    )}
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
                    {!isRemitted && (
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
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openPanel(t)
                      }}
                      className={`ml-auto shrink-0 w-24 py-1 rounded-full text-[11px] font-semibold transition-colors border inline-flex items-center justify-center gap-1 ${
                        isClosed || isResolved || isRemitted
                          ? "bg-surface border-line text-muted hover:bg-hover"
                          : "bg-[#0A4159] border-transparent hover:bg-[#083349] active:bg-[#062a3c] text-white"
                      }`}
                    >
                      {buttonLabel}
                      {!isClosed && !isResolved && !isRemitted && (
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
              <p className="text-[13px]" style={{ color: "#a1a1a6" }}>
                No se encontraron tickets con los filtros seleccionados.
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
              {sorted.some((t) => t.type === "Sin Clasificar") && (
                <span
                  className="inline-flex items-center gap-1.5 text-[11px]"
                  style={{ color: "#86868b" }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--warn-bright)" }}
                  />
                  {sorted.filter((t) => t.type === "Sin Clasificar").length}{" "}
                  pendientes por clasificar
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
                const pendingCount = sorted
                  .slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE)
                  .filter((t) => t.type === "Sin Clasificar").length
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
                    {pendingCount > 0 && (
                      <span
                        className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full"
                        style={{ background: "var(--warn-bright)" }}
                      />
                    )}
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

      {/* Management panel – slide in */}
      {panelOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setPanelOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            {/* Cabecera mejorada */}
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
                    {selectedTicket.status !== "Remitido a otra dependencia" &&
                      selectedTicket.priority !== "Sin asignar" && (
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
                  onClick={() => setPanelOpen(false)}
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
              {/* Seguimiento unificado */}
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
                    ratedClosed={
                      selectedTicket.status === "Cerrado" &&
                      selectedTicket.rating != null
                    }
                  />
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
                  {/* Solicitante */}
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
                  {/* Datos compactos en grid */}
                  <div
                    className={`grid gap-x-4 gap-y-2 text-[11px] ${
                      selectedTicket.status === "Remitido a otra dependencia"
                        ? "grid-cols-2"
                        : "grid-cols-3"
                    }`}
                  >
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
                    {selectedTicket.status !==
                      "Remitido a otra dependencia" && (
                      <div>
                        <span className="text-gray-400">Tipo</span>
                        <p className="font-500 text-gray-700">
                          {selectedTicket.type}
                        </p>
                      </div>
                    )}
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
                  {/* Descripción */}
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
                  {/* Adjuntos */}
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

              {/* Clasificación, remisión y asignación (oculto si remitido o cerrado) */}
              {selectedTicket.status !== "Remitido a otra dependencia" &&
                selectedTicket.status !== "Cerrado" && (
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
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <p className="text-xs font-600 text-gray-500 uppercase tracking-wide">
                        Gestión del ticket
                      </p>
                    </div>
                    <div className="p-4 space-y-3">
                      {/* Remitir (solo sin clasificar) */}
                      {isUnclassifiedTicket && (
                        <div
                          className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5"
                          style={{
                            background: remitChecked ? "#fdf5e0" : "#fef9ee",
                            border: `1px solid ${
                              remitChecked ? "#EDB02E" : "#f9d97b"
                            }`,
                          }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <svg
                              className="w-4 h-4 shrink-0"
                              style={{ color: "#92610a" }}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                              />
                            </svg>
                            <span
                              className="text-[11px] font-500 min-w-0"
                              style={{ color: "#92610a" }}
                            >
                              {remitChecked
                                ? `Remitir a ${remitEmail}`
                                : "¿No corresponde a la OATI? Remitir"}
                            </span>
                          </div>
                          {!remitChecked ? (
                            <button
                              onClick={() => toggleRemit(true)}
                              className="shrink-0 px-2.5 py-1 rounded-md text-[11px] font-600 border transition-colors hover:bg-amber-50"
                              style={{
                                color: "#92610a",
                                borderColor: "#f9d97b",
                                background: "white",
                              }}
                            >
                              Remitir
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setRemitOpen(true)}
                                className="shrink-0 px-2 py-1 rounded-md text-[11px] font-600 border transition-colors"
                                style={{
                                  color: "#92610a",
                                  borderColor: "#f9d97b",
                                  background: "white",
                                }}
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => toggleRemit(false)}
                                className="shrink-0 px-2 py-1 rounded-md text-[11px] font-600 border transition-colors"
                                style={{
                                  color: "#A6141D",
                                  borderColor: "#f5a8ac",
                                  background: "white",
                                }}
                              >
                                Cancelar
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Clasificación, separator, responsables (ocultos si remitir activo) */}
                      {!remitChecked && (
                        <>
                          <div>
                            <p className="text-[11px] text-gray-400 mb-1.5">
                              Clasificación
                            </p>
                            <div
                              className="rounded-lg border border-gray-100 p-3"
                              style={{ background: "white" }}
                            >
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <p className="text-[10px] font-600 text-gray-400 mb-0.5">
                                    Tipo
                                  </p>
                                  <select
                                    value={newType}
                                    onChange={(e) =>
                                      setNewType(e.target.value as TicketType)
                                    }
                                    className="w-full px-2.5 py-1.5 rounded-lg text-xs border bg-white"
                                    style={{
                                      borderColor: "#e2e8f0",
                                      outline: "none",
                                    }}
                                  >
                                    {typeOptions.map((t) => (
                                      <option key={t} value={t}>
                                        {t}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <p className="text-[10px] font-600 text-gray-400 mb-0.5">
                                    Prioridad / SLA
                                  </p>
                                  <select
                                    value={newPriority}
                                    onChange={(e) =>
                                      setNewPriority(
                                        e.target.value as TicketPriority,
                                      )
                                    }
                                    className="w-full px-2.5 py-1.5 rounded-lg text-xs border bg-white"
                                    style={{
                                      borderColor: "#e2e8f0",
                                      outline: "none",
                                      color:
                                        newPriority === "Sin asignar"
                                          ? "#9ca3af"
                                          : "inherit",
                                    }}
                                  >
                                    <option value="Sin asignar" disabled>
                                      Seleccione…
                                    </option>
                                    {priorities.map((p) => (
                                      <option key={p} value={p}>
                                        {p}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              {newPriority !== "Sin asignar" && (
                                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#005A7E]">
                                  <svg
                                    className="w-3 h-3 shrink-0"
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
                                  SLA:{" "}
                                  <strong>
                                    {slaTimeLabel(
                                      SLA_HOURS_BY_PRIORITY[newPriority],
                                    )}
                                  </strong>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Separador si está clasificado */}
                          {!isUnclassifiedTicket && (
                            <div className="border-t border-gray-100" />
                          )}

                          {/* Asignar responsables (solo clasificados) */}
                          {!isUnclassifiedTicket && (
                            <div>
                              <p className="text-[11px] text-gray-400 mb-1.5">
                                Responsables
                              </p>
                              <div
                                className="rounded-lg border border-gray-100"
                                style={{ background: "white" }}
                              >
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
                                    value={assigneeSearch}
                                    onChange={(e) =>
                                      setAssigneeSearch(e.target.value)
                                    }
                                    placeholder="Buscar…"
                                    className="w-full text-xs bg-transparent outline-none"
                                  />
                                </div>
                                <div className="max-h-36 overflow-y-auto p-0.5">
                                  {filteredTechnicians.length === 0 ? (
                                    <p className="px-2.5 py-1.5 text-[11px] text-gray-400">
                                      Sin resultados
                                    </p>
                                  ) : (
                                    filteredTechnicians.map((name) => {
                                      const checked = assignees.includes(name)
                                      return (
                                        <label
                                          key={name}
                                          className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-slate-50 text-xs"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() =>
                                              toggleAssignee(name)
                                            }
                                            className="w-3.5 h-3.5 accent-[#005A7E]"
                                          />
                                          <span
                                            style={{
                                              color: checked
                                                ? "#005A7E"
                                                : "#334155",
                                            }}
                                          >
                                            {name}
                                          </span>
                                        </label>
                                      )
                                    })
                                  )}
                                </div>
                              </div>
                              {assignees.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {assignees.map((name) => (
                                    <span
                                      key={name}
                                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-500"
                                      style={{
                                        background: "#e0f0f7",
                                        color: "#005A7E",
                                      }}
                                    >
                                      {name}
                                      <button
                                        onClick={() => toggleAssignee(name)}
                                        className="hover:text-[#A6141D] ml-0.5"
                                        aria-label={`Quitar ${name}`}
                                      >
                                        <svg
                                          className="w-2.5 h-2.5"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M6 18L18 6M6 6l12 12"
                                          />
                                        </svg>
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

              {/* Nota interna (oculta si sin clasificar, remitido o cerrado) */}
              {!isUnclassifiedTicket &&
                selectedTicket.status !== "Remitido a otra dependencia" &&
                selectedTicket.status !== "Cerrado" && (
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
                          d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                        />
                      </svg>
                      <p className="text-xs font-600 text-gray-500 uppercase tracking-wide">
                        Nota interna
                      </p>
                    </div>
                    <div className="p-4">
                      <textarea
                        rows={3}
                        placeholder="Escribe una nota interna…"
                        value={internalNote}
                        onChange={(e) => setInternalNote(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs border bg-white resize-none transition-colors"
                        style={{ borderColor: "#e2e8f0", outline: "none" }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = "#005A7E")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = "#e2e8f0")
                        }
                      />
                    </div>
                  </div>
                )}

              {/* Diagnóstico del técnico */}
              {(selectedTicket.rootCause ||
                selectedTicket.workaround ||
                (selectedTicket.solutionStages &&
                  selectedTicket.solutionStages.length > 0)) && (
                <div
                  className="rounded-xl border border-gray-200 p-4"
                  style={{ background: "#f8fafc" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-600 text-gray-500 uppercase tracking-wide">
                      Diagnóstico del técnico
                    </p>
                    {selectedTicket.solutionStages &&
                      selectedTicket.solutionStages.length > 0 && (
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
                      )}
                  </div>

                  {selectedTicket.rootCause && (
                    <div className="mb-3">
                      <p className="text-[11px] font-600 text-gray-400 uppercase mb-1">
                        Causa raíz
                      </p>
                      <p
                        className="text-xs text-gray-700 leading-relaxed rounded-lg px-3 py-2"
                        style={{
                          background: "white",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        {selectedTicket.rootCause}
                      </p>
                    </div>
                  )}

                  {selectedTicket.workaround && (
                    <div className="mb-3">
                      <p className="text-[11px] font-600 text-gray-400 uppercase mb-1">
                        Solución temporal
                      </p>
                      <p
                        className="text-xs text-gray-700 leading-relaxed rounded-lg px-3 py-2"
                        style={{
                          background: "white",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        {selectedTicket.workaround}
                      </p>
                    </div>
                  )}

                  {selectedTicket.solutionStages &&
                    selectedTicket.solutionStages.length > 0 && (
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
                                  background: stage.done
                                    ? "#dcfce7"
                                    : "#f1f5f9",
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
                    )}
                </div>
              )}
            </div>

            <div
              className={`p-5 border-t border-gray-100 flex flex-col gap-2 shrink-0${
                selectedTicket.status === "Cerrado" ||
                selectedTicket.status === "Remitido a otra dependencia"
                  ? " hidden"
                  : ""
              }`}
            >
              {cannotSaveHint && (
                <div
                  className="flex items-start gap-2 text-xs font-500 rounded-lg px-3 py-2"
                  style={{ background: "#fce8e9", color: "#A6141D" }}
                >
                  <svg
                    className="w-3.5 h-3.5 mt-0.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3m0 0v3m0-3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {cannotSaveHint}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setPanelOpen(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-600 border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveChanges}
                  disabled={!canSave}
                  className="flex-1 py-2.5 rounded-lg text-sm font-600 text-white transition-all disabled:cursor-not-allowed"
                  style={{
                    background: !canSave
                      ? "#b6c7d2"
                      : remitChecked
                        ? "#E47113"
                        : "#0A4159",
                  }}
                >
                  {remitChecked
                    ? "Remitir solicitud"
                    : isUnclassifiedTicket
                      ? "Guardar clasificación"
                      : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remisión – modal de datos */}
      {remitOpen && selectedTicket && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setRemitOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-sm font-700 text-gray-900">
                  Remitir a otra dependencia
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Complete los datos para reenviar la solicitud
                </p>
              </div>
              <button
                onClick={() => setRemitOpen(false)}
                className="text-gray-400 hover:text-gray-600 shrink-0"
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
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-600 text-gray-500 mb-1">
                  Correo de la dependencia
                </label>
                <input
                  type="email"
                  value={remitEmail}
                  onChange={(e) => {
                    setRemitEmail(e.target.value)
                    if (!remitMessageTouched)
                      setRemitMessage(remitDefaultMessage(e.target.value))
                  }}
                  placeholder="dependencia@uniamazonia.edu.co"
                  className="w-full px-3 py-2 rounded-lg text-sm border bg-white"
                  style={{ borderColor: "#e2e8f0", outline: "none" }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "#E47113")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "#e2e8f0")
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-600 text-gray-500 mb-1">
                  Mensaje automático al usuario
                </label>
                <textarea
                  rows={5}
                  value={remitMessage}
                  onChange={(e) => {
                    setRemitMessage(e.target.value)
                    setRemitMessageTouched(true)
                  }}
                  className="w-full px-3 py-2.5 rounded-lg text-sm border bg-white resize-none"
                  style={{ borderColor: "#e2e8f0", outline: "none" }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "#E47113")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "#e2e8f0")
                  }
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setRemitOpen(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-600 border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setRemitOpen(false)}
                disabled={!remitEmail.trim()}
                className="flex-1 py-2.5 rounded-lg text-sm font-600 text-white transition-all disabled:cursor-not-allowed"
                style={{
                  background: remitEmail.trim() ? "#E47113" : "#e5c5a8",
                }}
              >
                Confirmar remisión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
