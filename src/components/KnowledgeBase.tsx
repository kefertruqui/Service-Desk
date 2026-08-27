import { useState } from "react"
import type { View } from "../types"
import { knowledgeArticles } from "../data/mockData"

interface Props {
  onNavigate: (view: View) => void
}

export default function KnowledgeBase({ onNavigate }: Props) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [selected, setSelected] =
    useState<typeof knowledgeArticles[number] | null>(null)

  const categories = [
    "all",
    ...Array.from(new Set(knowledgeArticles.map((a) => a.category))),
  ]
  const filtered = knowledgeArticles.filter((a) => {
    const ms =
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.summary.toLowerCase().includes(search.toLowerCase())
    const mc = category === "all" || a.category === category
    return ms && mc
  })

  if (selected) {
    return (
      <div className="h-full flex flex-col">
        <div className="shrink-0 px-8 pt-8 pb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2
              className="text-[26px] leading-tight font-semibold whitespace-nowrap"
              style={{ color: "#005A7E", letterSpacing: "-0.02em" }}
            >
              Base de Conocimiento
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
              {selected.category} · Artículo de ayuda para la comunidad
              universitaria.
            </p>
          </div>
          <button
            onClick={() => setSelected(null)}
            className="shrink-0 inline-flex items-center gap-1.5 text-sm font-500 px-4 py-2.5 rounded-xl transition-colors"
            style={{ background: "#e8f4f9", color: "#005A7E" }}
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Volver
          </button>
        </div>
        <div className="flex-1 min-h-0 px-8 pb-6 overflow-y-auto">
          <div className="h-full w-full max-w-4xl mx-auto bg-white rounded-2xl border border-gray-100 p-6 overflow-y-auto">
            <span
              className="text-xs px-2.5 py-1 rounded-full font-500"
              style={{ background: "#e8f4f9", color: "#005A7E" }}
            >
              {selected.category}
            </span>
            <h1
              className="text-xl font-700 text-gray-900 mt-3 mb-2"
              style={{ letterSpacing: "-0.02em" }}
            >
              {selected.title}
            </h1>
            <p className="text-sm text-gray-500 mb-6">{selected.summary}</p>
            <div className="prose prose-sm max-w-none">
              <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
                {selected.steps ? (
                  <>
                    <h3 className="font-600 text-gray-900">Introducción</h3>
                    <p>{selected.intro}</p>
                    <h3 className="font-600 text-gray-900">Pasos a seguir</h3>
                    <ol className="list-decimal pl-5 space-y-2">
                      {selected.steps.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ol>
                    {selected.tips && (
                      <>
                        <h3 className="font-600 text-gray-900">
                          Recomendaciones
                        </h3>
                        <ul className="list-disc pl-5 space-y-2">
                          {selected.tips.map((t, i) => (
                            <li key={i}>{t}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <h3 className="font-600 text-gray-900">Introducción</h3>
                    <p>
                      Este artículo describe el procedimiento paso a paso para
                      completar el proceso indicado de forma segura y eficiente,
                      siguiendo las políticas institucionales de la Universidad
                      de la Amazonia.
                    </p>
                    <h3 className="font-600 text-gray-900">Pasos a seguir</h3>
                    <ol className="list-decimal pl-5 space-y-2">
                      <li>
                        Ingrese al portal institucional en{" "}
                        <span className="font-500" style={{ color: "#005A7E" }}>
                          mi.uniamazonia.edu.co
                        </span>{" "}
                        con su usuario y contraseña.
                      </li>
                      <li>
                        Navegue hasta la sección correspondiente usando el menú
                        principal.
                      </li>
                      <li>
                        Siga las instrucciones en pantalla y complete todos los
                        campos requeridos.
                      </li>
                      <li>
                        Confirme la operación y guarde o descargue el
                        comprobante si aplica.
                      </li>
                      <li>Cierre sesión correctamente al terminar.</li>
                    </ol>
                    <h3 className="font-600 text-gray-900">
                      Solución de problemas frecuentes
                    </h3>
                    <p>
                      Si encuentra dificultades durante el proceso, verifique
                      que su conexión a internet sea estable y que esté usando
                      un navegador actualizado (Chrome, Firefox o Edge). Si el
                      problema persiste, registre un incidente en la Mesa de
                      Servicios OATI.
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="flex gap-4 text-xs text-gray-400">
                <span>👁 {selected.views.toLocaleString()} vistas</span>
                <span>👍 {selected.helpful}% útil</span>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1.5 rounded-lg text-xs font-500 border"
                  style={{ borderColor: "#e2e8f0", color: "#64748b" }}
                >
                  👍 Útil
                </button>
                <button
                  className="px-3 py-1.5 rounded-lg text-xs font-500 border"
                  style={{ borderColor: "#e2e8f0", color: "#64748b" }}
                >
                  👎 No útil
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Sección 1: Encabezado */}
      <div className="shrink-0 px-8 pt-8 pb-5">
        <h2
          className="text-[26px] leading-tight font-semibold whitespace-nowrap"
          style={{ color: "#005A7E", letterSpacing: "-0.02em" }}
        >
          Base de Conocimiento
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
          Guías, manuales, tutoriales y preguntas frecuentes para la comunidad
          universitaria.
        </p>
      </div>

      {/* Sección 2: Búsqueda */}
      <div className="shrink-0 px-6 pt-4">
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
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
            placeholder="Buscar artículos, guías, preguntas frecuentes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border bg-white"
            style={{ borderColor: "#e2e8f0", outline: "none" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#005A7E")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
          />
        </div>
      </div>

      {/* Sección 3: Filtro de categorías */}
      <div className="shrink-0 px-6 pt-3 flex gap-2 flex-wrap">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className="px-3 py-1.5 rounded-full text-xs font-500 border transition-all"
            style={{
              background: category === c ? "#005A7E" : "white",
              color: category === c ? "white" : "#64748b",
              borderColor: category === c ? "#005A7E" : "#e2e8f0",
            }}
          >
            {c === "all" ? "Todos" : c}
          </button>
        ))}
      </div>

      {/* Sección 4: Artículos */}
      <div className="flex-1 min-h-0 px-6 pt-4 pb-5 overflow-y-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelected(a)}
              className="bg-white rounded-xl border border-gray-200 p-4 text-left transition-all hover:-translate-y-0.5 group"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 4px 16px rgba(0,90,126,0.12)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)")
              }
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-xs px-2 py-0.5 rounded font-500"
                  style={{ background: "#e8f4f9", color: "#005A7E" }}
                >
                  {a.category}
                </span>
                <span className="text-xs text-gray-300">👁 {a.views}</span>
              </div>
              <h3 className="text-sm font-600 text-gray-900 mb-1.5 leading-snug">
                {a.title}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                {a.summary}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {a.tags.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ background: "#f3f4f6", color: "#6b7280" }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <span className="text-xs" style={{ color: "#34AB1E" }}>
                  {a.helpful}% útil
                </span>
              </div>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 mt-2">
            <p className="text-gray-400 text-sm">
              No se encontraron artículos para "{search}"
            </p>
            <button
              onClick={() => onNavigate("new-request")}
              className="mt-3 text-sm font-500"
              style={{ color: "#005A7E" }}
            >
              ¿No encontró lo que buscaba? Registre una solicitud →
            </button>
          </div>
        )}
      </div>

      {/* Sección 5: CTA */}
      <div className="shrink-0 px-6 py-4 border-t border-gray-50">
        <div
          className="rounded-xl border border-gray-200 p-4 flex items-center justify-between bg-white"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          <div>
            <p className="text-sm font-600 text-gray-900">
              ¿No encontró solución?
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              El equipo OATI está disponible para ayudarle.
            </p>
          </div>
          <button
            onClick={() => onNavigate("new-request")}
            className="px-4 py-2 rounded-lg text-sm font-600 text-white transition-all hover:opacity-90"
            style={{ background: "#005A7E" }}
          >
            Registrar Solicitud
          </button>
        </div>
      </div>
    </div>
  )
}
