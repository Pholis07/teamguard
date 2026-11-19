import { useReducer, useState, type Dispatch, type ReactNode } from 'react'

// Tipos del contrato de las 9:30. Provisionales: se borran y se importan de
// src/domain en cuanto B los publique.
type Member = { id: string; name: string; availableHours: number }
type Task = {
  id: string
  title: string
  ownerId: string
  estimatedHours: number
  status: 'pending' | 'active' | 'done'
  dueDate: string
  requiresFile: boolean
}
type Absence = { memberId: string; from: string; to: string; status: string }
type Entrega = { taskId: string; uploaderId: string; file: File }

// Estado compartido. Las cargas no se guardan: se calculan con las funciones
// de B a partir de este estado.
type Estado = {
  members: Member[]
  tasks: Task[]
  absence: Absence | null
  files: Entrega[]
}

// Simular, editar y rechazar no pasan por aquí: solo aceptar cambia ownerId.
type Accion =
  | { type: 'acceptProposal'; taskId: string; ownerId: string }
  | { type: 'setAbsence'; absence: Absence | null }
  | { type: 'addFile'; entrega: Entrega }
  | { type: 'reset' }

// Se sustituye por el caso común de B.
const ESTADO_INICIAL: Estado = { members: [], tasks: [], absence: null, files: [] }

function reducer(estado: Estado, accion: Accion): Estado {
  switch (accion.type) {
    case 'acceptProposal':
      return {
        ...estado,
        tasks: estado.tasks.map((t) =>
          t.id === accion.taskId ? { ...t, ownerId: accion.ownerId } : t,
        ),
      }
    case 'setAbsence':
      return { ...estado, absence: accion.absence }
    case 'addFile':
      return { ...estado, files: [...estado.files, accion.entrega] }
    case 'reset':
      return ESTADO_INICIAL
  }
}

type VistaProps = { estado: Estado; dispatch: Dispatch<Accion> }

type Vista = 'tablero' | 'contingencia' | 'entrega'

const VISTAS: Record<Vista, { label: string; render: (props: VistaProps) => ReactNode }> = {
  tablero: { label: 'Tablero', render: () => <p>Tablero (A · src/ui)</p> },
  contingencia: {
    label: 'Contingencia',
    render: () => <p>Contingencia (A + B · src/ui, src/domain)</p>,
  },
  entrega: { label: 'Entrega', render: () => <p>Entrega (C · src/delivery)</p> },
}

export default function App() {
  const [vista, setVista] = useState<Vista>('tablero')
  const [estado, dispatch] = useReducer(reducer, ESTADO_INICIAL)

  return (
    <div className="app">
      <header className="app-header">
        <h1>TeamGuard</h1>
        <nav>
          {(Object.keys(VISTAS) as Vista[]).map((id) => (
            <button
              key={id}
              aria-current={vista === id ? 'page' : undefined}
              onClick={() => setVista(id)}
            >
              {VISTAS[id].label}
            </button>
          ))}
        </nav>
      </header>
      <main>{VISTAS[vista].render({ estado, dispatch })}</main>
    </div>
  )
}
