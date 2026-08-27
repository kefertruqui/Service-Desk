import { useState } from "react"
import type { View, UserInfo } from "../types"

interface NavItem {
  id: View
  label: string
  icon: React.ReactNode
  badge?: number
  adminOnly?: boolean
}

interface Props {
  currentView: View
  onNavigate: (view: View) => void
  user: UserInfo
  onLogout: () => void
  children: React.ReactNode
  openTicketCount?: number
  assignedTicketCount?: number
}

const NavIcon = ({ d, ...props }: { d: string; [k: string]: unknown }) => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d={d} />
  </svg>
)

export default function Layout({
  currentView,
  onNavigate,
  user,
  onLogout,
  children,
  openTicketCount = 0,
  assignedTicketCount = 0,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems: NavItem[] = [
    {
      id: "new-request",
      label: "Nueva Solicitud",
      icon: (
        <NavIcon d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
    },
    {
      id: "my-tickets",
      label: "Mis Tickets",
      icon: (
        <NavIcon d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      ),
      badge: openTicketCount > 0 ? openTicketCount : undefined,
    },
    {
      id: "assigned-tickets",
      label: "Tickets Asignados",
      icon: (
        <NavIcon d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-6.93 4 4 0 004 6.93zM16 7a4 4 0 11-8 0 4 4 0 018 0z" />
      ),
      badge: assignedTicketCount > 0 ? assignedTicketCount : undefined,
    },
    {
      id: "knowledge-base",
      label: "Base de Conocimiento",
      icon: (
        <NavIcon d="M4 7v13a2 2 0 002 2h12a2 2 0 002-2V7M4 7h16M4 7a2 2 0 002-2h12a2 2 0 012 2M9 11h6m-6 4h3" />
      ),
    },
  ]

  const adminItems: NavItem[] = [
    {
      id: "admin",
      label: "Panel Administración",
      icon: (
        <NavIcon d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      ),
    },
  ]

  const NavLink = ({ item }: { item: NavItem }) => {
    const active =
      currentView === item.id ||
      (item.id === "admin" && currentView === "admin-ticket")
    return (
      <button
        onClick={() => {
          onNavigate(item.id)
          setSidebarOpen(false)
        }}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-500 transition-all group"
        style={{
          background: active ? "rgba(255,255,255,0.16)" : "transparent",
          color: active ? "#ffffff" : "rgba(255,255,255,0.68)",
        }}
        onMouseEnter={(e) => {
          if (!active)
            e.currentTarget.style.background = "rgba(255,255,255,0.09)"
          e.currentTarget.style.color = "#ffffff"
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.background = "transparent"
            e.currentTarget.style.color = "rgba(255,255,255,0.68)"
          }
        }}
      >
        <span className="shrink-0">{item.icon}</span>
        <span className="flex-1 text-left">{item.label}</span>
        {item.badge !== undefined && (
          <span
            className="text-xs font-600 px-1.5 py-0.5 rounded-full"
            style={{ background: "#A7F3D0", color: "#14532d" }}
          >
            {item.badge}
          </span>
        )}
      </button>
    )
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={
        mobile ? "flex flex-col h-full w-72" : "flex flex-col h-full w-64"
      }
      style={{ background: "#0A4159" }}
    >
      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {navItems.map((item) => (
          <NavLink key={item.id} item={item} />
        ))}

        {user.role === "admin" && (
          <>
            <div className="pt-4 pb-1 px-4">
              <p
                className="text-xs font-600 tracking-widest uppercase"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Administración
              </p>
            </div>
            {adminItems.map((item) => (
              <NavLink key={item.id} item={item} />
            ))}
          </>
        )}
      </nav>

      <div className="px-4 pb-4 pt-3 border-t border-white/10 flex items-center gap-2">
        <p className="text-white/50 text-xs truncate flex-1 text-left">
          Universidad de la Amazonia
        </p>
        <button
          onClick={onLogout}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors hover:bg-white/10"
          style={{ color: "rgba(255,255,255,0.65)" }}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar móvil (solo hamburguesa) */}
        <header className="md:hidden shrink-0 h-12 flex items-center gap-2 px-3 border-b border-line-soft bg-surface">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-muted hover:bg-hover hover:text-accent transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
