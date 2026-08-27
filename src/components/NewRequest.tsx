import { useRef, useState } from "react"
import type { UserInfo, View } from "../types"
import { categoryTree } from "../data/mockData"

interface Props {
  user: UserInfo
  onSubmit: (data: Record<string, string>) => void
  onNavigate: (view: View) => void
}

const inputCls =
  "w-full px-4 py-2.5 rounded-xl text-sm border bg-white transition-colors"

export default function NewRequest({ user, onSubmit, onNavigate }: Props) {
  const [form, setForm] = useState<Record<string, string>>({})
  const [category, setCategory] = useState("")
  const [subcategory, setSubcategory] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeCategory = categoryTree.find((c) => c.name === category)
  const subcategories = activeCategory?.subcategories ?? []

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const addFiles = (list: FileList | null) => {
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
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name))
      return [...prev, ...valid.filter((f) => !names.has(f.name))]
    })
    setFileError(
      invalid.length > 0
        ? `Solo se permiten imágenes (PNG, JPG, GIF, WEBP, SVG). Se omitió${
            invalid.length > 1 ? "n" : ""
          } ${invalid.length} archivo${
            invalid.length > 1 ? "s" : ""
          } no válido${invalid.length > 1 ? "s" : ""}.`
        : "",
    )
  }

  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }))
    if (errors[k])
      setErrors((e) => {
        const n = { ...e }
        delete n[k]
        return n
      })
  }

  const borderClr = (err?: string) => (err ? "#A6141D" : "#e2e8f0")

  const selectCategory = (name: string) => {
    setCategory(name)
    setSubcategory("")
    setForm((f) => ({ ...f, category: name, subcategory: "" }))
    if (errors.category || errors.subcategory) {
      setErrors((e) => {
        const n = { ...e }
        delete n.category
        delete n.subcategory
        return n
      })
    }
  }

  const selectSubcategory = (name: string) => {
    setSubcategory(name)
    setForm((f) => ({ ...f, subcategory: name }))
    if (errors.subcategory)
      setErrors((e) => {
        const n = { ...e }
        delete n.subcategory
        return n
      })
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!category) e.category = "Seleccione una categoría"
    if (category && !subcategory) e.subcategory = "Seleccione una subcategoría"
    if (!form.title?.trim()) e.title = "Ingrese un título para la solicitud"
    if (!form.description?.trim()) e.description = "Ingrese una descripción"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    setFileError("")
    onSubmit({
      ...form,
      category,
      subcategory,
      attachments: files.map((f) => f.name).join(", "),
    })
  }

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="shrink-0 px-8 pt-8 pb-5">
        <h2
          className="text-[26px] leading-tight font-semibold whitespace-nowrap"
          style={{ color: "#005A7E", letterSpacing: "-0.02em" }}
        >
          Nueva Solicitud
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
          Complete el formulario y el equipo de la Mesa de Servicios clasificará
          y atenderá su solicitud a la brevedad.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex-1 min-h-0 px-6 pt-5 pb-5 flex flex-col gap-4"
      >
        {/* User info (auto, no editable) */}
        <div
          className="shrink-0 relative rounded-2xl px-4 py-3 flex items-center gap-3.5"
          style={{
            background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
            border: "1px solid #eef2f6",
          }}
        >
          <span
            className="absolute top-2.5 right-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-600"
            style={{
              background: "#fdf5e0",
              color: "#92610a",
              border: "1.5px solid #EDB02E",
            }}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date().toLocaleString("es-CO", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
          <div className="relative shrink-0">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-700"
              style={{
                background: "#005A7E",
                color: "white",
                border: "3px solid white",
                boxShadow: "0 0 0 1px #dbe3eb",
              }}
            >
              {user.avatar}
            </div>
            <span
              className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white"
              style={{ background: "#34AB1E" }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-700 text-gray-900 leading-tight truncate">
              {user.name}
            </h3>
            <span
              className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-600"
              style={{
                background: "#e5f5f3",
                color: "#0B750E",
                border: "1.5px solid #34AB1E",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: "#34AB1E",
                  boxShadow: "0 0 0 3px rgba(52,171,30,0.15)",
                }}
              />
              {user.cargo}
            </span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {[
                {
                  value: user.email,
                  icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
                },
                {
                  value: user.dependencia,
                  icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
                },
                {
                  value: user.sede,
                  icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
                },
              ].map((d, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] text-gray-500 min-w-0"
                  style={{ background: "rgba(148,163,184,0.10)" }}
                >
                  <svg
                    className="w-3.5 h-3.5 shrink-0 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={d.icon} />
                  </svg>
                  <span className="truncate" title={d.value}>
                    {d.value}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
          {/* Category + subcategory */}
          <div
            className="flex flex-col gap-4 min-h-0 rounded-2xl px-5 py-5 overflow-hidden"
            style={{
              background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
              border: "1px solid #eef2f6",
            }}
          >
            <div className="shrink-0">
              <label
                className="flex items-center gap-2 text-sm font-500 mb-2"
                style={{ color: "#005A7E" }}
              >
                <span
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-700 text-white shrink-0"
                  style={{ background: "#005A7E" }}
                >
                  1
                </span>
                Categoría <span style={{ color: "#A6141D" }}>*</span>
              </label>
              <div className="space-y-1.5">
                {categoryTree.map((c) => {
                  const active = category === c.name
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => selectCategory(c.name)}
                      className="w-full text-left px-4 py-2 rounded-xl text-sm transition-all border"
                      style={{
                        background: active ? "#e8f4f9" : "white",
                        color: active ? "#005A7E" : "#475569",
                        fontWeight: 400,
                        borderColor: active ? "#b3d9ec" : "#e2e8f0",
                      }}
                      onMouseEnter={(e) => {
                        if (!active)
                          e.currentTarget.style.borderColor = "#94a3b8"
                        e.currentTarget.style.background = "#f8fafc"
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.borderColor = "#e2e8f0"
                          e.currentTarget.style.background = "white"
                        }
                      }}
                    >
                      <span className="flex items-center justify-between gap-2">
                        {c.name}
                        {active && (
                          <svg
                            className="w-4 h-4 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
              {errors.category && (
                <p className="text-xs mt-1.5" style={{ color: "#A6141D" }}>
                  {errors.category}
                </p>
              )}
            </div>

            {category && (
              <div className="shrink-0">
                <label
                  className="flex items-center gap-2 text-sm font-500 mb-2"
                  style={{ color: "#005A7E" }}
                >
                  <span
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-700 text-white shrink-0"
                    style={{ background: "#005A7E" }}
                  >
                    2
                  </span>
                  Subcategoría <span style={{ color: "#A6141D" }}>*</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {subcategories.map((s) => {
                    const active = subcategory === s
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => selectSubcategory(s)}
                        className="px-3 py-1.5 rounded-lg text-xs font-500 border transition-all"
                        style={{
                          background: active ? "#e5f5f3" : "white",
                          color: active ? "#0E7C66" : "#475569",
                          borderColor: active ? "#bfe3dd" : "#e2e8f0",
                        }}
                      >
                        {s}
                      </button>
                    )
                  })}
                </div>
                {errors.subcategory && (
                  <p className="text-xs mt-1.5" style={{ color: "#A6141D" }}>
                    {errors.subcategory}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Fields */}
          <div
            className="flex flex-col gap-4 min-h-0 rounded-2xl px-5 py-5 overflow-hidden"
            style={{
              background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
              border: "1px solid #eef2f6",
            }}
          >
            <div className="flex items-center gap-2 shrink-0">
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-700 text-white shrink-0"
                style={{ background: "#005A7E" }}
              >
                3
              </span>
              <label
                className="block text-sm font-500"
                style={{ color: "#005A7E" }}
              >
                Información de la solicitud
              </label>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 shrink-0">
              <div>
                <label
                  className="block text-sm font-500 mb-2"
                  style={{ color: "#005A7E" }}
                >
                  Ubicación <span style={{ color: "#A6141D" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Bloque D – Oficina 204"
                  value={form.location ?? ""}
                  onChange={(e) => set("location", e.target.value)}
                  className={inputCls}
                  style={{ borderColor: borderClr(), outline: "none" }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "#005A7E")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = borderClr())
                  }
                />
              </div>
              <div>
                <label
                  className="block text-sm font-500 mb-2"
                  style={{ color: "#005A7E" }}
                >
                  Teléfono de contacto
                </label>
                <input
                  type="text"
                  placeholder="Ej. 6028354750 Ext. 234"
                  value={form.phone ?? ""}
                  onChange={(e) => set("phone", e.target.value)}
                  className={inputCls}
                  style={{ borderColor: borderClr(), outline: "none" }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "#005A7E")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = borderClr())
                  }
                />
              </div>
            </div>

            <div className="shrink-0">
              <label
                className="block text-sm font-500 mb-2"
                style={{ color: "#005A7E" }}
              >
                Título solicitud <span style={{ color: "#A6141D" }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Ej. No puedo acceder al correo institucional"
                value={form.title ?? ""}
                onChange={(e) => set("title", e.target.value)}
                className={inputCls}
                style={{
                  borderColor: borderClr(errors.title),
                  outline: "none",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#005A7E")}
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = borderClr(errors.title))
                }
              />
              {errors.title && (
                <p className="text-xs mt-1.5" style={{ color: "#A6141D" }}>
                  {errors.title}
                </p>
              )}
            </div>

            <div className="shrink-0">
              <label
                className="block text-sm font-500 mb-2"
                style={{ color: "#005A7E" }}
              >
                Descripción detallada{" "}
                <span style={{ color: "#A6141D" }}>*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Describa con el mayor detalle posible el problema o servicio que requiere."
                value={form.description ?? ""}
                onChange={(e) => set("description", e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm border bg-white resize-none"
                style={{
                  borderColor: borderClr(errors.description),
                  outline: "none",
                  height: "120px",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#005A7E")}
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = borderClr(
                    errors.description,
                  ))
                }
              />
              {errors.description && (
                <p className="text-xs mt-1.5" style={{ color: "#A6141D" }}>
                  {errors.description}
                </p>
              )}
            </div>

            {/* Attachments */}
            <div className="flex flex-col shrink-0">
              <label
                className="block text-sm font-500 mb-2 shrink-0"
                style={{ color: "#005A7E" }}
              >
                Adjuntos (opcional)
              </label>
              <div
                className="h-16 shrink-0 rounded-xl px-4 flex items-center justify-center gap-3 cursor-pointer transition-colors"
                style={{
                  border: "1.5px dashed",
                  borderColor: dragOver ? "#005A7E" : "#cbd5e1",
                  background: dragOver ? "#f0f8fc" : "transparent",
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOver(false)
                  addFiles(e.dataTransfer.files)
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <svg
                  className="w-5 h-5 text-gray-300 shrink-0"
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
                <p className="text-sm text-gray-500 text-center">
                  Arrastre imágenes aquí o{" "}
                  <span style={{ color: "#005A7E" }} className="font-500">
                    selecciónelas
                  </span>{" "}
                  <span className="text-gray-400">
                    (PNG, JPG, JPEG, GIF, WEBP, SVG)
                  </span>
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    addFiles(e.target.files)
                    e.target.value = ""
                  }}
                />
              </div>
              {fileError && (
                <p className="mt-1.5 text-[11px]" style={{ color: "#A6141D" }}>
                  {fileError}
                </p>
              )}
              {files.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-2 shrink-0">
                  {files.map((f, i) => (
                    <span
                      key={`${f.name}_${i}`}
                      className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg text-xs whitespace-nowrap max-w-full"
                      style={{ background: "#f0f8fc", color: "#005A7E" }}
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
                          d="M15.172 7.172a4 4 0 015.656 5.656l-6.5 6.5a6 6 0 11-8.485-8.485l5.657-5.657"
                        />
                      </svg>
                      <span className="truncate">{f.name}</span>
                      <span className="opacity-60">{formatSize(f.size)}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFiles((prev) => prev.filter((_, j) => j !== i))
                        }
                        className="hover:text-gray-600 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="shrink-0 flex items-center justify-end gap-3 pt-3 border-t border-gray-50">
          <button
            type="button"
            onClick={() => onNavigate("my-tickets")}
            className="px-5 py-2.5 rounded-xl text-sm font-500 text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl text-sm font-600 text-white transition-all hover:opacity-90"
            style={{ background: "#005A7E" }}
          >
            Enviar Solicitud
          </button>
        </div>
      </form>
    </div>
  )
}
