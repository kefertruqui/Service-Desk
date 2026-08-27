import type { View } from "../types"

interface Props {
  ticketNumber: string
  onNavigate: (view: View) => void
}

export default function TicketSuccess({ ticketNumber, onNavigate }: Props) {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div
        className="bg-white rounded-2xl border border-gray-200 p-8 text-center"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      >
        {/* Success icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: "#edf7ea" }}
        >
          <svg
            className="w-10 h-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#34AB1E"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h2
          className="text-xl font-700 text-gray-900 mb-2"
          style={{ letterSpacing: "-0.02em" }}
        >
          Solicitud registrada exitosamente
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          La Mesa de Servicios de la OATI ha recibido su solicitud.
        </p>

        {/* Ticket number */}
        <div
          className="inline-flex items-center gap-3 px-5 py-3 rounded-xl mb-6"
          style={{ background: "#e8f4f9", border: "2px solid #b3d9ec" }}
        >
          <svg
            className="w-5 h-5"
            style={{ color: "#005A7E" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          <div>
            <p className="text-xs text-gray-500 text-left">Número del ticket</p>
            <p
              className="text-lg font-800"
              style={{ color: "#005A7E", letterSpacing: "-0.02em" }}
            >
              {ticketNumber}
            </p>
          </div>
        </div>

        {/* Status + SLA */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div
            className="px-4 py-3 rounded-xl border border-gray-100"
            style={{ background: "#f8fafc" }}
          >
            <p className="text-xs text-gray-400 mb-1">Estado inicial</p>
            <div className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#005A7E" }}
              />
              <span className="text-sm font-600" style={{ color: "#005A7E" }}>
                Registrado
              </span>
            </div>
          </div>
          <div
            className="px-4 py-3 rounded-xl border border-gray-100"
            style={{ background: "#f8fafc" }}
          >
            <p className="text-xs text-gray-400 mb-1">Próximo paso</p>
            <p className="text-sm font-600 text-gray-800">Clasificación OATI</p>
          </div>
        </div>

        {/* Info */}
        <div
          className="text-left rounded-xl p-4 mb-6"
          style={{ background: "#f0f8fc", border: "1px solid #b3d9ec" }}
        >
          <ul className="space-y-2.5">
            {[
              "Recibirá una confirmación a su correo institucional con el número del ticket y los detalles.",
              "El equipo OATI clasificará su solicitud como incidente o servicio y definirá la prioridad y el SLA.",
              'Podrá consultar el estado y agregar comentarios desde la sección "Mis Tickets".',
              "Se le notificará por correo en cada cambio de estado del ticket.",
            ].map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-xs text-gray-600"
              >
                <svg
                  className="w-3.5 h-3.5 mt-0.5 shrink-0"
                  style={{ color: "#169586" }}
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
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onNavigate("my-tickets")}
            className="flex-1 py-2.5 rounded-xl text-sm font-600 text-white transition-all hover:opacity-90"
            style={{ background: "#005A7E" }}
          >
            Ver mis tickets
          </button>
          <button
            onClick={() => onNavigate("new-request")}
            className="flex-1 py-2.5 rounded-xl text-sm font-600 border transition-all"
            style={{ borderColor: "#005A7E", color: "#005A7E" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e8f4f9")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            Crear nueva solicitud
          </button>
        </div>
      </div>

      {/* Email preview */}
      <div
        className="mt-4 bg-white rounded-xl border border-gray-200 p-5"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <p className="text-xs font-600 text-gray-500 uppercase tracking-wide">
            Vista previa del correo de confirmación
          </p>
        </div>
        <div className="rounded-lg border border-gray-100 overflow-hidden text-xs">
          <div className="px-4 py-3" style={{ background: "#005A7E" }}>
            <div className="flex items-center gap-2">
              <span className="text-white/60">Asunto:</span>
              <span className="text-white font-500">
                [OATI] Recepción de solicitud – {ticketNumber}
              </span>
            </div>
          </div>
          <div className="p-4 space-y-2 text-gray-600">
            <p>Estimada/o usuaria/o,</p>
            <p>
              La Mesa de Servicios de la{" "}
              <strong>OATI – Universidad de la Amazonia</strong> ha recibido su
              solicitud correctamente.
            </p>
            <div
              className="py-2 px-3 rounded"
              style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
            >
              <div className="flex justify-between">
                <span className="text-gray-400">Ticket N°:</span>
                <span className="font-700" style={{ color: "#005A7E" }}>
                  {ticketNumber}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-400">Estado:</span>
                <span className="font-600">Registrado</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-400">Fecha:</span>
                <span>
                  {new Date().toLocaleDateString("es-CO", {
                    dateStyle: "long",
                  })}
                </span>
              </div>
            </div>
            <p>
              Será atendida dentro de los tiempos definidos por los Acuerdos de
              Nivel de Servicio (SLA). Recibirá notificaciones por correo
              durante todo el proceso.
            </p>
            <p className="text-gray-400">
              — Mesa de Servicios OATI · Universidad de la Amazonia
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
