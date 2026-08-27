export type View = "login" | "new-request" | "my-tickets" | "ticket-detail" | "admin" | "assigned-tickets" | "admin-ticket" | "knowledge-base" | "service-catalog" | "ticket-success"

export type TicketStatus = "Registrado" | "Clasificado" | "Asignado" | "En atención" | "Resuelto" | "Cerrado" | "Remitido a otra dependencia"

export type TicketPriority = "Crítica" | "Alta" | "Media" | "Baja" | "Sin asignar"
export type TicketType = "Incidente" | "Solicitud" | "Problema" | "Sin Clasificar"
export type ClosureCode = "resuelto" | "resuelto_con_workaround" | "no_resuelto" | "duplicado" | "cancelado"

export interface UserInfo {
  name: string
  email: string
  dependencia: string
  cargo: string
  sede: string
  role: "user" | "admin" | "technician"
  avatar: string
}

export interface TicketComment {
  id: string
  author: string
  role: string
  content: string
  timestamp: string
  isInternal: boolean
}

export type AdminNotificationType = "sla-warning" | "sla-expired" | "new-ticket" | "info"

export interface AdminNotification {
  id: string
  type: AdminNotificationType
  title: string
  message: string
  ticketId?: string
  ticketNumber?: string
  timestamp: string
  read: boolean
}

export interface TicketActivity {
  id: string
  action: string
  author: string
  timestamp: string
  from?: string
  to?: string
}

export interface SolutionStage {
  id: string
  description: string
  done: boolean
  doneAt?: string
}

export interface Ticket {
  id: string
  number: string
  title: string
  type: TicketType
  category: string
  subcategory: string
  status: TicketStatus
  priority: TicketPriority
  rating?: number
  description: string
  createdAt: string
  updatedAt: string
  assignedTo?: string
  technician?: string
  slaHours: number
  slaRemaining?: number
  slaStartedAt?: string
  location: string
  phone: string
  user: UserInfo
  comments: TicketComment[]
  activities: TicketActivity[]
  attachments: string[]
  solutionEvidence?: string[]
  solutionStages?: SolutionStage[]
  rootCause?: string
  workaround?: string
  closureCode?: ClosureCode
  remittedEmail?: string
}
