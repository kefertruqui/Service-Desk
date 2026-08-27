import { useState } from "react"
import type { UserInfo } from "../types"
import type { Theme } from "../hooks/useTheme"
import { currentUser, adminUser } from "../data/mockData"
import ThemeToggle from "./ThemeToggle"

interface Props {
  onLogin: (user: UserInfo) => void
  theme?: Theme
  onToggleTheme?: () => void
}

export default function LoginPage({
  onLogin,
  theme = "light",
  onToggleTheme,
}: Props) {
  const [user, setUser] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!user || !password) {
      setError("Por favor ingrese su usuario y contraseña.")
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      if (
        user.toLowerCase().includes("admin") ||
        user.toLowerCase().includes("martinez")
      ) {
        onLogin(adminUser)
      } else {
        onLogin(currentUser)
      }
    }, 1200)
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg relative overflow-hidden">
      {/* Glow decorativo del acento */}
      <div
        aria-hidden
        className="absolute -top-40 -right-40 w-125 h-125 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, var(--accent-ring) 0%, transparent 65%)",
        }}
      />
      <div
        aria-hidden
        className="absolute -bottom-52 -left-40 w-100 h-100 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, var(--accent-ring) 0%, transparent 70%)",
        }}
      />

      {/* Top branding bar */}
      <div className="relative z-10 flex items-center gap-3 px-6 sm:px-8 py-4 border-b border-line-soft">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "#005A7E" }}
        >
          <svg viewBox="0 0 40 40" className="w-8 h-8">
            <circle cx="20" cy="20" r="18" fill="#005A7E" />
            <text
              x="20"
              y="26"
              textAnchor="middle"
              fill="white"
              fontSize="14"
              fontWeight="700"
              fontFamily="Poppins, sans-serif"
            >
              UA
            </text>
          </svg>
        </div>
        <div>
          <p className="font-semibold text-sm leading-tight text-ink">
            Universidad de la Amazonia
          </p>
          <p className="text-faint text-xs">Florencia, Caquetá · Colombia</p>
        </div>
        <div className="flex-1" />
        {onToggleTheme && (
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        )}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-surface rounded-2xl border border-line shadow-xl shadow-black/5 overflow-hidden">
            {/* Card header */}
            <div className="px-8 pt-8 pb-6 text-center border-b border-line-soft">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-accent-soft">
                <svg
                  className="w-8 h-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-ink tracking-tight">
                Mesa de Servicios OATI
              </h1>
              <p className="text-sm text-muted mt-1">
                Ingrese con sus credenciales institucionales
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
              {error && (
                <div className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm bg-danger-bg text-danger">
                  <svg
                    className="w-4 h-4 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-body">
                  Usuario institucional
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-faint">
                    <svg
                      className="w-4.5 h-4.5"
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
                  </span>
                  <input
                    type="text"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    placeholder="usuario@uniamazonia.edu.co"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-line bg-surface text-ink placeholder:text-faint focus:border-accent-mid outline-none transition-colors text-sm"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-body">
                  Contraseña
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-faint">
                    <svg
                      className="w-4.5 h-4.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña institucional"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-line bg-surface text-ink placeholder:text-faint focus:border-accent-mid outline-none transition-colors text-sm"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg text-on-accent text-sm font-semibold transition-all hover:bg-accent-strong disabled:opacity-80 flex items-center justify-center gap-2"
                style={{ background: "#005A7E" }}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Autenticando...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </button>

              <p className="text-xs text-center text-faint pt-1">
                La autenticación se realiza mediante el Directorio Activo
                institucional (LDAP).
                <br />
                No se requiere registro previo.
              </p>
            </form>
          </div>

          {/* Demo hint */}
          <div className="mt-4 rounded-xl px-5 py-3.5 text-xs bg-accent-soft text-muted">
            <span className="font-semibold text-accent">Demo:</span> Use
            cualquier usuario para ingresar como docente, o incluya "admin" en
            el usuario para el panel de administración.
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-4 text-xs text-faint">
        © 2025 Universidad de la Amazonia · OATI – Oficina Asesora de
        Tecnologías de la Información
      </div>
    </div>
  )
}
