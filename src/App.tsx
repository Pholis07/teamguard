import { useEffect, useReducer, useState } from 'react'
import { Compartir } from './Compartir'
import { PASOS } from './guion'
import { GuiaPresentacion } from './Presentar'
import { EntregaVista } from './delivery/EntregaVista'
import { progresoEntrega } from './delivery/zip'
import { contextoDe, estadoInicial, reducer } from './ui/estado'
import { ahora, type PaginaId, type Tema } from './ui/formato'
import { Icono } from './ui/bloques'
import { Shell } from './ui/Shell'
import { Inicio } from './ui/Inicio'
import { CrearEspacio } from './ui/CrearEspacio'
import { TableroVista } from './ui/TableroVista'
import { IntegrantesVista } from './ui/IntegrantesVista'
import { TareasVista } from './ui/TareasVista'
import { ContingenciaVista } from './ui/ContingenciaVista'

const CLAVE_TEMA = 'tg-tema'

function temaGuardado(): Tema {
  try {
    return localStorage.getItem(CLAVE_TEMA) === 'claro' ? 'claro' : 'oscuro'
  } catch {
    return 'oscuro'
  }
}

export default function App() {
  const [pagina, setPagina] = useState<PaginaId>('tablero')
  const [tema, setTema] = useState<Tema>(temaGuardado)
  const [estado, dispatch] = useReducer(reducer, undefined, estadoInicial)
  // Demo guiada: null = sin presentar; si no, índice en PASOS.
  const [paso, setPaso] = useState<number | null>(null)

  useEffect(() => {
    document.documentElement.dataset.tema = tema
    try {
      localStorage.setItem(CLAVE_TEMA, tema)
    } catch {
      // Sin almacenamiento: el tema solo dura esta sesión.
    }
  }, [tema])

  const alternarTema = () => setTema((t) => (t === 'oscuro' ? 'claro' : 'oscuro'))

  // shortcut: entregas de ejemplo con los IDs del caso común (t1–t3, m1–m3); solo sirven para la demo.
  const muestra = (taskId: string, uploaderId: string, nombre: string, texto: string) => {
    if (estado.files.some((f) => f.taskId === taskId)) return
    dispatch({ type: 'addFile', entrega: { taskId, uploaderId, file: new File([texto], nombre, { type: 'text/plain' }) } })
  }
  function irAPaso(n: number) {
    setPaso(n)
    setPagina(PASOS[n].vista)
    if (PASOS[n].preparaEntregas) {
      muestra('t1', 'm1', 'boceto.txt', 'Boceto de Ana, subido antes de su ausencia (ejemplo).')
      muestra('t2', 'm2', 'ficha.txt', 'Ficha de Luis (ejemplo).')
    }
  }
  function presentar() {
    dispatch({ type: 'cargarEjemplo' })
    irAPaso(0)
  }
  const extra =
    paso !== null && PASOS[paso].preparaEntregas
      ? { label: 'Completar el Resumen', onClick: () => muestra('t3', 'm3', 'resumen.txt', 'Resumen de Sol (ejemplo).') }
      : undefined

  if (estado.fase === 'inicio') {
    return (
      <Inicio
        tema={tema}
        onTema={alternarTema}
        onEmpezar={() => {
          setPagina('tablero')
          dispatch({ type: 'entrar' })
        }}
        onEjemplo={() => {
          setPagina('tablero')
          dispatch({ type: 'cargarEjemplo' })
        }}
      />
    )
  }

  if (!estado.proyecto) {
    return (
      <CrearEspacio
        tema={tema}
        onCrear={(nombre) => {
          setPagina('tablero')
          dispatch({ type: 'iniciar', nombre })
        }}
        onEjemplo={() => {
          setPagina('tablero')
          dispatch({ type: 'cargarEjemplo' })
        }}
        onVolver={() => dispatch({ type: 'salir' })}
      />
    )
  }

  const { proyecto, members, tasks } = estado
  const contexto = contextoDe(estado)
  const { listas, total } = progresoEntrega(tasks, estado.files)

  return (
    <Shell
      pagina={pagina}
      proyecto={proyecto}
      contadores={{ integrantes: members.length, tareas: tasks.length, entrega: tasks.length > 0 ? `${listas}/${total}` : undefined }}
      tema={tema}
      onNavegar={setPagina}
      onTema={alternarTema}
      onInicio={() => dispatch({ type: 'salir' })}
      onReiniciar={() => {
        setPaso(null)
        setPagina('tablero')
        dispatch({ type: 'reset' })
      }}
      acciones={
        <>
          <Compartir />
          <button type="button" className="btn btn-p n-presentar" onClick={presentar} disabled={paso !== null} aria-label="Presentar">
            <Icono nombre="presentar" tam={14} /><span className="n-acc-t">Presentar</span>
          </button>
        </>
      }
    >
      {pagina === 'tablero' && <TableroVista proyecto={proyecto.nombre} members={members} tasks={tasks} contexto={contexto} onIr={setPagina} />}
      {pagina === 'integrantes' && <IntegrantesVista members={members} tasks={tasks} dispatch={dispatch} />}
      {pagina === 'tareas' && <TareasVista members={members} tasks={tasks} files={estado.files} dispatch={dispatch} onIr={setPagina} />}
      {pagina === 'contingencia' && (
        <ContingenciaVista
          contexto={contexto}
          absence={estado.absence}
          onSetAbsence={(absence) => dispatch({ type: 'setAbsence', absence, hora: ahora() })}
          onAccept={(proposal) => dispatch({ type: 'acceptProposal', proposal, hora: ahora() })}
        />
      )}
      {pagina === 'entrega' && (
        <EntregaVista
          tasks={tasks}
          members={members}
          files={estado.files}
          decisiones={estado.decisiones}
          onAddFile={(entrega) => dispatch({ type: 'addFile', entrega })}
        />
      )}
      {paso !== null && <GuiaPresentacion paso={paso} onIr={irAPaso} onSalir={() => setPaso(null)} extra={extra} />}
    </Shell>
  )
}
