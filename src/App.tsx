import { useState } from "react"
import type { View, UserInfo, Ticket } from "./types"
import { mockTickets } from "./data/mockData"
import { useTheme } from "./hooks/useTheme"

import LoginPage from "./components/LoginPage"
import Layout from "./components/Layout"
import NewRequest from "./components/NewRequest"
import MyTickets from "./components/MyTickets"
import TicketDetail from "./components/TicketDetail"
import TicketSuccess from "./components/TicketSuccess"
import AdminDashboard from "./components/AdminDashboard"
import AssignedTickets from "./components/AssignedTickets"
import KnowledgeBase from "./components/KnowledgeBase"
import ServiceCatalog from "./components/ServiceCatalog"

export default function App() {
  const [view, setView] = useState<View>("login")
  const [user, setUser] = useState<UserInfo | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [lastTicketNumber, setLastTicketNumber] = useState("")
  const [blockedNewRequest, setBlockedNewRequest] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const pendingSurveys =
    user && user.name
      ? tickets.filter(
          (t) =>
            t.user?.name === user.name &&
            ["Cerrado", "Remitido a otra dependencia", "Resuelto"].includes(
              t.status,
            ) &&
            t.rating == null,
        )
      : []

  const navigate = (nextView: View, ticketId?: string) => {
    if (nextView === "new-request" && pendingSurveys.length > 0) {
      setBlockedNewRequest(true)
      return
    }
    if (ticketId) setSelectedTicketId(ticketId)
    setView(nextView)
    window.scrollTo(0, 0)
  }

  const handleLogin = (loggedUser: UserInfo) => {
    setUser(loggedUser)
    setView("my-tickets")
  }

  const handleLogout = () => {
    setUser(null)
    setView("login")
  }

  const handleFormSubmit = (data: Record<string, string>) => {
    const num = `TK-${String(tickets.length + 1 + 900).padStart(4, "0")}`
    const newTicket: Ticket = {
      id: String(tickets.length + 1),
      number: num,
      title: data.title ?? "Nueva solicitud",
      type: "Sin Clasificar",
      category: data.category ?? "Otros",
      subcategory: data.subcategory ?? "",
      status: "Registrado",
      priority: "Sin asignar",
      description: data.description ?? "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      slaHours: 0,
      location: data.location ?? user?.sede ?? "",
      phone: data.phone ?? "",
      user: user!,
      comments: [],
      activities: [
        {
          id: "a1",
          action: "Solicitud registrada",
          author: user?.name ?? "",
          timestamp: new Date().toISOString(),
        },
      ],
      attachments: [],
    }
    setTickets((prev) => [newTicket, ...prev])
    setLastTicketNumber(num)
    navigate("ticket-success")
  }

  const handleUpdateTicket = (id: string, updates: Partial<Ticket>) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, ...updates, updatedAt: new Date().toISOString() }
          : t,
      ),
    )
  }

  if (view === "login" || !user) {
    return (
      <LoginPage
        onLogin={handleLogin}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    )
  }

  const selectedTicket = selectedTicketId
    ? (tickets.find((t) => t.id === selectedTicketId) ?? tickets[0])
    : tickets[0]
  const openCount = tickets.filter(
    (t) => !["Cerrado", "Remitido a otra dependencia"].includes(t.status),
  ).length
  const assignedCount = user?.name
    ? tickets.filter(
        (t) =>
          t.technician &&
          t.technician
            .split(",")
            .map((s) => s.trim())
            .includes(user.name),
      ).length
    : 0

  return (
    <>
      <Layout
        currentView={view}
        onNavigate={navigate}
        user={user}
        onLogout={handleLogout}
        openTicketCount={openCount}
        assignedTicketCount={assignedCount}
      >
        {view === "new-request" && (
          <NewRequest
            user={user}
            onSubmit={handleFormSubmit}
            onNavigate={navigate}
          />
        )}
        {view === "my-tickets" && (
          <MyTickets
            tickets={tickets}
            onNavigate={navigate}
            onUpdateTicket={handleUpdateTicket}
          />
        )}
        {view === "ticket-detail" && selectedTicket && (
          <TicketDetail ticket={selectedTicket} onNavigate={navigate} />
        )}
        {view === "ticket-success" && (
          <TicketSuccess
            ticketNumber={lastTicketNumber}
            onNavigate={navigate}
          />
        )}
        {view === "admin" && (
          <AdminDashboard
            tickets={tickets}
            onNavigate={navigate}
            onUpdateTicket={handleUpdateTicket}
            user={user}
          />
        )}
        {view === "assigned-tickets" && (
          <AssignedTickets
            tickets={tickets}
            onNavigate={navigate}
            onUpdateTicket={handleUpdateTicket}
            user={user}
          />
        )}
        {view === "admin-ticket" && selectedTicket && (
          <TicketDetail ticket={selectedTicket} onNavigate={navigate} />
        )}
        {view === "knowledge-base" && <KnowledgeBase onNavigate={navigate} />}
        {view === "service-catalog" && <ServiceCatalog onNavigate={navigate} />}
      </Layout>

      {blockedNewRequest && (
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
                {pendingSurveys.length} solicitud
                {pendingSurveys.length !== 1 ? "es" : ""} que tienes pendiente
                {pendingSurveys.length !== 1 ? "s" : ""}. Dirígete a la sección{" "}
                <strong>Mis Tickets</strong> para completar la encuesta.
              </p>
            </div>
            <button
              onClick={() => {
                setBlockedNewRequest(false)
                navigate("my-tickets")
              }}
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
