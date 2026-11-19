import { useReducer, useState, type Dispatch, type ReactNode } from 'react'
import {
  confirmProposal,
  createDemoState,
  DEMO_DATE,
  type Absence,
  type CoverageProposal,
  type RuleContext,
} from './domain'

type Entrega = { taskId: string; uploaderId: string; file: File }

// Estado compartido. Las cargas no se guardan: las calcula B a partir de aquí.
type Estado = ReturnType<typeof createDemoState> & { files: Entrega[] }

// Simular, editar y rechazar no pasan por aquí: solo aceptar cambia ownerId.
type Accion =
  | { type: 'acceptProposal'; proposal: CoverageProposal }
  | { type: 'setAbsence'; absence: Absence | null }
  | { type: 'addFile'; entrega: Entrega }
  | { type: 'reset' }

const estadoInicial = (): Estado => ({ ...createDemoState(), files: [] })

const contextoDe = (estado: Estado): RuleContext => ({
  members: estado.members,
  tasks: estado.tasks,
  absences: estado.absence ? [estado.absence] : [],
  asOf: DEMO_DATE,
})

function reducer(estado: Estado, accion: Accion): Estado {
  switch (accion.type) {
    case 'acceptProposal':
      try {
        return { ...estado, tasks: confirmProposal(contextoDe(estado), accion.proposal) }
      } catch (error) {
        // Propuesta obsoleta (p. ej. doble clic en Aceptar): se ignora en vez de tumbar la app.
        console.warn(error)
        return estado
      }
    case 'setAbsence':
      return { ...estado, absence: accion.absence }
    case 'addFile':
      return { ...estado, files: [...estado.files, accion.entrega] }
    case 'reset':
      return estadoInicial()
  }
}

type VistaProps = { estado: Estado; contexto: RuleContext; dispatch: Dispatch<Accion> }

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
  const [estado, dispatch] = useReducer(reducer, undefined, estadoInicial)

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
      <main>{VISTAS[vista].render({ estado, contexto: contextoDe(estado), dispatch })}</main>
    </div>
  )
}
