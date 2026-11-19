import { useEffect, useReducer, useState, type ReactNode } from 'react'
import { Compartir } from './Compartir'
import { PASOS } from './guion'
import { GuiaPresentacion } from './Presentar'
import { EntregaVista } from './delivery/EntregaVista'
import { progresoEntrega } from './delivery/zip'
import { contextoDe, estadoInicial, reducer } from './ui/estado'
import { acentoGuardado, ahora, aplicarAcento, guardarAcento, type Acento, type PaginaId, type Tema } from './ui/formato'
import { ACENTO_SUGERIDO, guardarVersion, irAVersion, versionDeHash, versionGuardada, VersionContext, type Version } from './ui/version'
import { Icono } from './ui/bloques'
import { Shell } from './ui/Shell'
import { Inicio } from './ui/Inicio'
import { CrearEspacio } from './ui/CrearEspacio'
import { TableroVista } from './ui/TableroVista'
import { IntegrantesVista } from './ui/IntegrantesVista'
import { TareasVista } from './ui/TareasVista'
import { ContingenciaVista } from './ui/ContingenciaVista'
import { RescateVista } from './ui/RescateVista'

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
  // Acento elegido de forma explícita; mientras sea null se sugiere uno según la versión.
  const [elegido, setElegido] = useState<Acento | null>(acentoGuardado)
  const [estado, dispatch] = useReducer(reducer, undefined, () => estadoInicial(versionGuardada()))
  const acento = elegido ?? ACENTO_SUGERIDO[estado.version]
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

  useEffect(() => aplicarAcento(acento), [acento])
  useEffect(() => guardarVersion(estado.version), [estado.version])
  const setAcento = (a: Acento) => {
    guardarAcento(a)
    setElegido(a)
  }
  // Landing por hash (#/estudiantes, #/empresas): la versión sale de la URL y, sin ella, de la última guardada.
  useEffect(() => {
    const desdeHash = () => {
      const v = versionDeHash(window.location.hash)
      if (v) dispatch({ type: 'setVersion', version: v })
    }
    if (!versionDeHash(window.location.hash)) window.history.replaceState(null, '', `#/${versionGuardada()}`)
    else desdeHash()
    window.addEventListener('hashchange', desdeHash)
    return () => window.removeEventListener('hashchange', desdeHash)
  }, [])
  const cambiarVersion = (version: Version) => {
    irAVersion(version)
    dispatch({ type: 'salir' })
  }

  const alternarTema = () => setTema((t) => (t === 'oscuro' ? 'claro' : 'oscuro'))

  // shortcut: entregas de ejemplo con los IDs del caso común (t1–t3, m1–m3); solo sirven para la demo.
  const muestra = (taskId: string, uploaderId: string, nombre: string, texto: string) => {
    if (estado.files.some((f) => f.taskId === taskId)) return
    dispatch({ type: 'addFile', entrega: { taskId, uploaderId, file: new File([texto], nombre, { type: 'text/plain' }) } })
  }
  function irAPaso(n: number) {
    setPaso(n)
    setPagina(PASOS[n].vista)
    // shortcut: dependencia de ejemplo con los IDs del caso común (Resumen t3 depende de Ficha t2); solo para la demo.
    if (PASOS[n].preparaRescate && !estado.tasks.find((t) => t.id === 't3')?.dependsOn?.includes('t2')) {
      dispatch({ type: 'updateTask', id: 't3', cambios: { dependsOn: ['t2'] } })
    }
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

  const conVersion = (n: ReactNode) => <VersionContext.Provider value={estado.version}>{n}</VersionContext.Provider>

  if (estado.fase === 'inicio') {
    return conVersion(
      <Inicio
        tema={tema}
        onTema={alternarTema}
        acento={acento}
        onAcento={setAcento}
        version={estado.version}
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
    return conVersion(
      <CrearEspacio
        tema={tema}
        acento={acento}
        onAcento={setAcento}
        version={estado.version}
        onCambiarVersion={cambiarVersion}
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

  return conVersion(
    <Shell
      pagina={pagina}
      proyecto={proyecto}
      contadores={{ integrantes: members.length, tareas: tasks.length, entrega: tasks.length > 0 ? `${listas}/${total}` : undefined }}
      tema={tema}
      acento={acento}
      onAcento={setAcento}
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
      {pagina === 'tablero' && <TableroVista proyecto={proyecto.nombre} members={members} tasks={tasks} files={estado.files} contexto={contexto} decisiones={estado.decisiones} onIr={setPagina} />}
      {pagina === 'integrantes' && <IntegrantesVista members={members} tasks={tasks} files={estado.files} dispatch={dispatch} />}
      {pagina === 'tareas' && <TareasVista members={members} tasks={tasks} files={estado.files} dispatch={dispatch} onIr={setPagina} />}
      {pagina === 'contingencia' && (
        <ContingenciaVista
          contexto={contexto}
          absence={estado.absence}
          onSetAbsence={(absence) => dispatch({ type: 'setAbsence', absence, hora: ahora() })}
          onAccept={(proposal) => dispatch({ type: 'acceptProposal', proposal, hora: ahora() })}
        />
      )}
      {pagina === 'rescate' && (
        <RescateVista contexto={contexto} onAplicar={(change) => dispatch({ type: 'applyRescueChange', change, hora: ahora() })} />
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
