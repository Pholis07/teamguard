import { useEffect, useMemo, useReducer, useState, type Dispatch, type ReactNode } from 'react'
import {
  confirmProposal,
  createDemoState,
  DEMO_DATE,
  type Absence,
  type CoverageProposal,
  type RuleContext,
} from './domain'
import { EntregaVista } from './delivery/EntregaVista'
import type { Decision } from './delivery/acta'
import { progresoEntrega, type Entrega } from './delivery/zip'
import { ContingenciaVista } from './ui/ContingenciaVista'
import { rango } from './ui/formato'
import { TableroVista } from './ui/TableroVista'

// Estado compartido. Las cargas no se guardan: las calcula B a partir de aquí.
type Estado = ReturnType<typeof createDemoState> & { files: Entrega[]; decisiones: Decision[] }

// Simular, editar y rechazar no pasan por aquí: solo aceptar cambia ownerId.
// `hora` la pone quien despacha, para que el reducer siga siendo puro.
type Accion =
  | { type: 'acceptProposal'; proposal: CoverageProposal; hora: string }
  | { type: 'setAbsence'; absence: Absence | null; hora: string }
  | { type: 'addFile'; entrega: Entrega }
  | { type: 'reset' }

const estadoInicial = (): Estado => ({ ...createDemoState(), files: [], decisiones: [] })

const ahora = () => new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

const nombreDe = (estado: Estado, id: string) => estado.members.find((m) => m.id === id)?.name ?? id

const anotar = (estado: Estado, hora: string, texto: string): Decision[] => [...estado.decisiones, { hora, texto }]

const contextoDe = (estado: Estado): RuleContext => ({
  members: estado.members,
  tasks: estado.tasks,
  absences: estado.absence ? [estado.absence] : [],
  asOf: DEMO_DATE,
})

function reducer(estado: Estado, accion: Accion): Estado {
  switch (accion.type) {
    case 'acceptProposal': {
      const { proposal, hora } = accion
      try {
        const tasks = confirmProposal(contextoDe(estado), proposal)
        const titulo = tasks.find((t) => t.id === proposal.taskId)?.title ?? proposal.taskId
        const texto = `${titulo} pasó de ${nombreDe(estado, proposal.currentOwnerId)} a ${nombreDe(estado, proposal.candidateId)} (cobertura aceptada)`
        return { ...estado, tasks, decisiones: anotar(estado, hora, texto) }
      } catch (error) {
        // Propuesta obsoleta (p. ej. doble clic en Aceptar): se ignora en vez de tumbar la app.
        console.warn(error)
        return estado
      }
    }
    case 'setAbsence': {
      const { absence, hora } = accion
      // Solo fechas: el motivo de una ausencia nunca se registra.
      const texto = absence
        ? `Se registró la ausencia de ${nombreDe(estado, absence.memberId)} del ${rango(absence.from, absence.to)}`
        : estado.absence && `Se retiró la ausencia de ${nombreDe(estado, estado.absence.memberId)}`
      return { ...estado, absence, decisiones: texto ? anotar(estado, hora, texto) : estado.decisiones }
    }
    case 'addFile':
      return { ...estado, files: [...estado.files, accion.entrega] }
    case 'reset':
      return estadoInicial()
  }
}

type VistaProps = { estado: Estado; contexto: RuleContext; dispatch: Dispatch<Accion> }

type Vista = 'tablero' | 'contingencia' | 'entrega'

// Iconos del mockup v4 (trazos Lucide).
const icono = (d: ReactNode) => (
  <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
)

type VistaDef = {
  label: string
  icon: ReactNode
  contador?: (estado: Estado) => string
  render: (props: VistaProps) => ReactNode
}

const VISTAS: Record<Vista, VistaDef> = {
  tablero: {
    label: 'Tablero',
    icon: icono(<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
    render: ({ estado }) => <TableroVista members={estado.members} tasks={estado.tasks} />,
  },
  contingencia: {
    label: 'Contingencia',
    icon: icono(<><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /><path d="m4.93 4.93 4.24 4.24" /><path d="m14.83 9.17 4.24-4.24" /><path d="m14.83 14.83 4.24 4.24" /><path d="m9.17 14.83-4.24 4.24" /></>),
    render: ({ estado, contexto, dispatch }) => (
      <ContingenciaVista
        contexto={contexto}
        absence={estado.absence}
        onSetAbsence={(absence) => dispatch({ type: 'setAbsence', absence, hora: ahora() })}
        onAccept={(proposal) => dispatch({ type: 'acceptProposal', proposal, hora: ahora() })}
      />
    ),
  },
  entrega: {
    label: 'Entrega',
    contador: (estado) => {
      const { listas, total } = progresoEntrega(estado.tasks, estado.files)
      return `${listas}/${total}`
    },
    icon: icono(<><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></>),
    render: ({ estado, dispatch }) => (
      <EntregaVista
        tasks={estado.tasks}
        members={estado.members}
        files={estado.files}
        decisiones={estado.decisiones}
        onAddFile={(entrega) => dispatch({ type: 'addFile', entrega })}
      />
    ),
  },
}

export default function App() {
  const [vista, setVista] = useState<Vista>('tablero')
  const [estado, dispatch] = useReducer(reducer, undefined, estadoInicial)
  const contexto = useMemo(() => contextoDe(estado), [estado])
  const [oscuro, setOscuro] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', oscuro)
  }, [oscuro])

  return (
    <div className="shell">
      <aside className="side">
        <div className="marca serif">
          <img src="/brand/tigre-blanco.png" alt="" width="30" height="30" />
          TeamGuard
        </div>
        <p className="lbl">Proyecto</p>
        <nav className="sn" aria-label="Secciones">
          {(Object.keys(VISTAS) as Vista[]).map((id) => (
            <button
              key={id}
              aria-current={vista === id ? 'page' : undefined}
              onClick={() => setVista(id)}
            >
              {VISTAS[id].icon}
              {VISTAS[id].label}
              {VISTAS[id].contador && <span className="n">{VISTAS[id].contador(estado)}</span>}
            </button>
          ))}
        </nav>
        <p className="lbl">Integrantes</p>
        <div className="miembros">
          {estado.members.map((m, i) => (
            <span key={m.id}>
              <span className={`av av-s av${i + 1}`}>{m.name[0]}</span>
              {m.name}
            </span>
          ))}
        </div>
        <div className="relleno" />
        <p className="lema serif">
          El trabajo es de todos.
          <br />
          <em>La responsabilidad también.</em>
        </p>
        <p className="demo">DATOS DE EJEMPLO</p>
      </aside>
      <div className="sheet">
        <div className="topbar">
          <span className="fa">Proyecto final</span>
          <span className="fa">/</span>
          <span>{VISTAS[vista].label}</span>
          <span className="acciones">
            <button className="btn btn-s" aria-pressed={oscuro} onClick={() => setOscuro(!oscuro)}>
              {oscuro ? 'Tema claro' : 'Tema oscuro'}
            </button>
            <button className="btn btn-s" onClick={() => dispatch({ type: 'reset' })}>
              Restablecer demo
            </button>
          </span>
        </div>
        <main className="contenido">
          {VISTAS[vista].render({ estado, contexto, dispatch })}
        </main>
      </div>
    </div>
  )
}
