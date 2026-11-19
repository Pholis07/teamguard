import { useEffect, useReducer, useState } from 'react'
import { EntregaVista } from './delivery/EntregaVista'
import { contextoDe, estadoInicial, reducer } from './ui/estado'
import type { PaginaId, Tema } from './ui/formato'
import { Shell } from './ui/Shell'
import { Inicio } from './ui/Inicio'
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

  useEffect(() => {
    document.documentElement.dataset.tema = tema
    try {
      localStorage.setItem(CLAVE_TEMA, tema)
    } catch {
      // Sin almacenamiento: el tema solo dura esta sesión.
    }
  }, [tema])

  const alternarTema = () => setTema((t) => (t === 'oscuro' ? 'claro' : 'oscuro'))

  if (estado.fase === 'inicio' || !estado.proyecto) {
    return (
      <Inicio
        tema={tema}
        onTema={alternarTema}
        onEmpezar={(nombre) => {
          setPagina('tablero')
          dispatch({ type: 'iniciar', nombre })
        }}
        onEjemplo={() => {
          setPagina('tablero')
          dispatch({ type: 'cargarEjemplo' })
        }}
      />
    )
  }

  const { proyecto, members, tasks } = estado
  const contexto = contextoDe(estado)

  return (
    <Shell
      pagina={pagina}
      proyecto={proyecto}
      contadores={{ integrantes: members.length, tareas: tasks.length }}
      tema={tema}
      onNavegar={setPagina}
      onTema={alternarTema}
      onInicio={() => dispatch({ type: 'salir' })}
      onReiniciar={() => {
        setPagina('tablero')
        dispatch({ type: 'reset' })
      }}
    >
      {pagina === 'tablero' && <TableroVista proyecto={proyecto.nombre} members={members} tasks={tasks} onIr={setPagina} />}
      {pagina === 'integrantes' && <IntegrantesVista members={members} tasks={tasks} dispatch={dispatch} />}
      {pagina === 'tareas' && <TareasVista members={members} tasks={tasks} dispatch={dispatch} />}
      {pagina === 'contingencia' && (
        <ContingenciaVista
          contexto={contexto}
          absence={estado.absence}
          onSetAbsence={(absence) => dispatch({ type: 'setAbsence', absence })}
          onAccept={(proposal) => dispatch({ type: 'acceptProposal', proposal })}
        />
      )}
      {pagina === 'entrega' && (
        <EntregaVista
          tasks={tasks}
          members={members}
          files={estado.files}
          onAddFile={(entrega) => dispatch({ type: 'addFile', entrega })}
        />
      )}
    </Shell>
  )
}
