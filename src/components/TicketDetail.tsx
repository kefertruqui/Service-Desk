import { useState } from "react"
import type { Ticket, View } from "../types"
import { StatusBadge, PriorityBadge } from "./StatusBadge"

interface Props {
  ticket: Ticket
  onNavigate: (view: View) => void
}

export default function TicketDetail({ ticket, onNavigate }: Props) {
  const [comment, setComment] = useState("")

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  const slaPercent =
    ticket.slaRemaining !== undefined
      ? Math.max(
          0,
          Math.min(100, (ticket.slaRemaining / ticket.slaHours) * 100),
        )
      : null

  const slaColor =
    slaPercent !== null
      ? slaPercent > 50
        ? "#34AB1E"
        : slaPercent > 20
          ? "#EDB02E"
          : "#A6141D"
      : "#34AB1E"

  const typeChip = {
    background:
      ticket.type === "Incidente"
        ? "#fce8e9"
        : ticket.type === "Solicitud"
          ? "#e5f5f3"
          : ticket.type === "Problema"
            ? "#fef0e4"
            : "#fdf5e0",
    color:
      ticket.type === "Incidente"
        ? "#A6141D"
        : ticket.type === "Solicitud"
          ? "#0d6b5e"
          : ticket.type === "Problema"
            ? "#933d0a"
            : "#92610a",
  }

  return (
    <div className="h-full p-4">
      <div className="h-full max-w-6xl mx-auto bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden">
        {/* Sección 1: Encabezado */}
        <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3.5 shrink-0">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "#e8f4f9" }}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="#005A7E"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <h2
              className="font-700 text-gray-900 text-2xl"
              style={{ letterSpacing: "-0.02em" }}
            >
              Detalle del Ticket
            </h2>
            <p
              className="flex items-center gap-1.5 text-xs mt-0.5"
              style={{ color: "#005A7E" }}
            >
              <svg
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: "#005A7E" }}
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
              Consulte el detalle, el historial y las comunicaciones de su
              solicitud {ticket.number}.
            </p>
          </div>
        </div>

        {/* Sección 2: Resumen del ticket */}
        <div className="shrink-0 px-6 pt-5">
          <div
            className="rounded-2xl px-5 py-4 flex flex-col lg:flex-row lg:items-center gap-4"
            style={{
              background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
              border: "1px solid #eef2f6",
            }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-xs font-700 px-2 py-0.5 rounded"
                  style={{ background: "#e8f4f9", color: "#005A7E" }}
                >
                  {ticket.number}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded font-500"
                  style={typeChip}
                >
                  {ticket.type}
                </span>
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
              </div>
              <h3
                className="text-lg font-700 text-gray-900 mt-2 leading-snug"
                style={{ letterSpacing: "-0.01em" }}
              >
                {ticket.title}
              </h3>
              <div className="flex items-center gap-4 mt-1.5 flex-wrap text-xs text-gray-400">
                <span>Creado: {formatDate(ticket.createdAt)}</span>
                <span>Actualizado: {formatDate(ticket.updatedAt)}</span>
                {ticket.technician && (
                  <span>
                    <span className="text-gray-400">Asignado a:</span>{" "}
                    <span className="font-500 text-gray-600">
                      {ticket.technician}
                    </span>
                  </span>
                )}
              </div>
            </div>

            {slaPercent !== null && ticket.slaRemaining !== undefined && (
              <div className="shrink-0 w-full lg:w-44">
                <p className="text-xs font-600 text-gray-500 mb-1.5">
                  SLA – Tiempo restante
                </p>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${slaPercent}%`, background: slaColor }}
                  />
                </div>
                <p className="text-xs mt-1" style={{ color: slaColor }}>
                  {ticket.slaRemaining}h restante
                  {ticket.slaRemaining !== 1 ? "s" : ""} de {ticket.slaHours}h
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Zona de secciones siguientes */}
        <div className="flex-1 min-h-0 px-6 py-4">
          <div className="h-full rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center gap-2">
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
                d="M12 9v3m0 0v3m0-3h3m-3 0H9"
              />
            </svg>
            <p className="text-sm text-gray-400">
              Las próximas secciones aparecerán aquí (detalle del problema,
              comunicaciones, historial, encuesta).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
