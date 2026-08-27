import { useState } from "react"
import type { View } from "../types"
import { categoryTree } from "../data/mockData"

interface Props {
  onNavigate: (view: View) => void
}

const categoryIcons: Record<string, string> = {
  "Sistema Misional Chaira": "🏛️",
  "Plataformas Institucionales": "🌐",
  "Correo Institucional": "📧",
  Conectividad: "📶",
  "Equipos y Periféricos": "🖥️",
  Software: "💿",
  "Solicitudes de Servicio": "🧰",
}

export default function ServiceCatalog({ onNavigate }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggle = (name: string) =>
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }))
  return (
    <div className="h-full p-4">
      <div className="h-full w-full bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden">
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <h2
              className="font-700 text-gray-900 text-2xl"
              style={{ letterSpacing: "-0.02em" }}
            >
              Catálogo de Servicios OATI
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
              Categorías y servicios tecnológicos disponibles para la comunidad
              universitaria.
            </p>
          </div>
        </div>

        {/* Sección 2: Aviso */}
        <div className="shrink-0 px-6 pt-4">
          <div
            className="rounded-xl px-4 py-3 flex items-start gap-3"
            style={{ background: "#e8f4f9", border: "1px solid #b3d9ec" }}
          >
            <svg
              className="w-4 h-4 mt-0.5 shrink-0"
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
            <p className="text-xs leading-relaxed" style={{ color: "#005A7E" }}>
              Para solicitar cualquier servicio, haga clic en "Solicitar" o use
              el formulario de Nueva Solicitud.
            </p>
          </div>
        </div>

        {/* Sección 3: Categorías */}
        <div className="flex-1 min-h-0 px-6 pt-3 pb-4">
          <div className="grid h-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr gap-3">
            {categoryTree.map((cat, i) => {
              const isExpanded = !!expanded[cat.name]
              const visible = isExpanded
                ? cat.subcategories
                : cat.subcategories.slice(0, 3)
              const remaining = cat.subcategories.length - 3
              return (
                <div
                  key={i}
                  className="h-full min-h-0 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col"
                  style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
                >
                  <div className="px-3.5 py-2.5 border-b border-gray-100 flex items-center gap-2 shrink-0">
                    <span className="text-base shrink-0">
                      {categoryIcons[cat.name] ?? "🛠️"}
                    </span>
                    <h3 className="text-[13px] font-700 text-gray-900 leading-tight min-w-0">
                      {cat.name}
                    </h3>
                  </div>
                  <div className="p-3 flex flex-col gap-2 flex-1 min-h-0">
                    <ul
                      className={
                        isExpanded
                          ? "grid grid-cols-2 gap-x-2.5 gap-y-1 flex-1 min-h-0"
                          : "space-y-1 flex-1 min-h-0"
                      }
                    >
                      {visible.map((s, j) => (
                        <li
                          key={j}
                          className="flex items-start gap-1.5 text-[11px] leading-snug text-gray-600"
                        >
                          <span
                            className="w-1 h-1 rounded-full shrink-0 mt-1.5"
                            style={{ background: "#005A7E" }}
                          />
                          <span className="min-w-0">{s}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="shrink-0 space-y-1.5">
                      {remaining > 0 && (
                        <button
                          onClick={() => toggle(cat.name)}
                          className="w-full py-1 rounded-lg text-[11px] font-600 transition-all"
                          style={{
                            background: isExpanded ? "#e8f4f9" : "#f8fafc",
                            color: "#005A7E",
                            border: "1px solid #b3d9ec",
                          }}
                        >
                          {isExpanded ? "Ver menos" : `Ver más (${remaining})`}
                        </button>
                      )}
                      <button
                        onClick={() => onNavigate("new-request")}
                        className="w-full py-1 rounded-lg text-[11px] font-600 text-white transition-all hover:opacity-90"
                        style={{ background: "#005A7E" }}
                      >
                        Solicitar servicio
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sección 4: Contacto */}
        <div className="shrink-0 px-6 py-3 border-t border-gray-50">
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              {
                icon: "📞",
                label: "Teléfono OATI",
                value: "6028354750 Ext. 100",
              },
              {
                icon: "📧",
                label: "Correo soporte",
                value: "soporte.oati@uniamazonia.edu.co",
              },
              {
                icon: "🕐",
                label: "Horario de atención",
                value: "Lun–Vie 7:00–18:00",
              },
            ].map((c, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
              >
                <span className="text-lg shrink-0">{c.icon}</span>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-500">{c.label}</p>
                  <p className="text-[13px] font-600 text-gray-800 truncate">
                    {c.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
