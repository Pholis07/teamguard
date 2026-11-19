import { useEffect, useRef, type Dispatch } from 'react'
import type { Member, Task } from '../domain'
import type { Entrega } from '../delivery/zip'
import type { Accion } from './estado'
import { BaseDeDatos, Callout, Etiqueta, Icono, Pagina, Propiedades } from './bloques'
import { ahora, ESTADO_TAREA, fechaValida, horas, horasValidas, nombreValido, plural, type PaginaId } from './formato'
import { Avatar, CeldaTexto } from './IntegrantesVista'
import './datos.css'

type Props = {
  members: readonly Member[]
  tasks: readonly Task[]
  files: readonly Entrega[]
  dispatch: Dispatch<Accion>
  /** Navega a otra página (para «Ir a 👥 Integrantes»). */
  onIr?: (p: PaginaId) => void
}

const ESTADOS = Object.keys(ESTADO_TAREA) as Task['status'][]
const leerHoras = (s: string) => (s.trim() === '' ? NaN : Number(s.trim().replace(',', '.')))
const FECHA_INICIAL = '2026-11-20'

export function TareasVista({ members, tasks, files, dispatch, onIr }: Props) {
  const nuevaRef = useRef<HTMLInputElement | null>(null)
  const esperando = useRef(false)

  // Tras «+ Nueva tarea», el foco va al título de la fila recién creada.
  useEffect(() => {
    if (esperando.current) { esperando.current = false; nuevaRef.current?.focus() }
  }, [tasks.length])

  const abiertas = tasks.filter((t) => t.status !== 'done').length
  const completadas = tasks.length - abiertas
  const total = tasks.reduce((s, t) => s + t.estimatedHours, 0)
  const nueva = () => {
    if (members.length === 0) return
    esperando.current = true
    dispatch({ type: 'addTask', title: 'Nueva tarea', ownerId: members[0].id, estimatedHours: 1, dueDate: FECHA_INICIAL, status: 'pending', requiresFile: true })
  }

  return (
    <Pagina
      icono="✅"
      titulo="Tareas"
      propiedades={<Propiedades items={[
        { icono: 'estado', etiqueta: 'Abiertas', valor: <span className="num">{abiertas}</span> },
        { icono: 'check', etiqueta: 'Completadas', valor: <span className="num">{completadas}</span> },
        { icono: 'reloj', etiqueta: 'Horas totales', valor: <span className="num">{horas(total)} h</span> },
      ]} />}
    >
      {members.length === 0 ? (
        <Callout icono="💡">
          <p className="dt-callout-p">Para crear tareas primero agrega a quienes las harán.</p>
          {onIr && <button type="button" className="btn btn-s" onClick={() => onIr('integrantes')}>Ir a 👥 Integrantes</button>}
        </Callout>
      ) : tasks.length === 0 && (
        <Callout icono="💡">Crea la primera tarea para ver cómo se reparte la carga del equipo.</Callout>
      )}
      <BaseDeDatos
        columnas={[
          { icono: 'texto', nombre: 'Tarea' },
          { icono: 'persona', nombre: 'Responsable', ancho: '124px' },
          { icono: 'numero', nombre: 'Horas', ancho: '84px' },
          { icono: 'calendario', nombre: 'Fecha límite', ancho: '136px' },
          { icono: 'estado', nombre: 'Estado', ancho: '118px' },
          { icono: 'check', nombre: 'Archivo', ancho: '92px' },
        ]}
        textoNueva="Nueva tarea"
        onNueva={members.length > 0 ? nueva : undefined}
      >
        {tasks.map((t, i) => {
          const dueno = members.findIndex((m) => m.id === t.ownerId)
          const est = ESTADO_TAREA[t.status]
          const ultima = i === tasks.length - 1
          const conArchivos = files.some((f) => f.taskId === t.id)
          return (
            <tr key={t.id} className="dt-fila">
              <td>
                <CeldaTexto
                  valor={t.title}
                  etiqueta={`Título de ${t.title}`}
                  entradaRef={ultima ? (el) => { nuevaRef.current = el } : undefined}
                  validar={(v) => (nombreValido(v) ? null : 'Escribe un nombre para la tarea.')}
                  onGuardar={(v) => dispatch({ type: 'updateTask', id: t.id, cambios: { title: v } })}
                />
              </td>
              <td>
                <div className="dt-nombre">
                  {dueno >= 0 && <Avatar nombre={members[dueno].name} indice={dueno} />}
                  <select
                    className="cel"
                    aria-label={`Responsable de ${t.title}`}
                    value={t.ownerId}
                    onChange={(e) => dispatch({ type: 'reassignTask', id: t.id, ownerId: e.target.value, hora: ahora() })}
                  >
                    {dueno < 0 && <option value={t.ownerId}>Sin responsable</option>}
                    {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </td>
              <td>
                <CeldaTexto
                  numerica
                  valor={horas(t.estimatedHours)}
                  etiqueta={`Horas de ${t.title}`}
                  validar={(v) => (horasValidas(leerHoras(v)) ? null : 'Escribe las horas como un número, por ejemplo 2.')}
                  onGuardar={(v) => dispatch({ type: 'updateTask', id: t.id, cambios: { estimatedHours: leerHoras(v) } })}
                />
              </td>
              <td>
                <FechaCelda tarea={t} dispatch={dispatch} />
              </td>
              <td>
                <label className="dt-estado">
                  <Etiqueta color={est.color}>{est.texto}</Etiqueta>
                  <select
                    className="dt-estado-sel"
                    aria-label={`Estado de ${t.title}`}
                    value={t.status}
                    onChange={(e) => dispatch({ type: 'updateTask', id: t.id, cambios: { status: e.target.value as Task['status'] } })}
                  >
                    {ESTADOS.map((s) => <option key={s} value={s}>{ESTADO_TAREA[s].texto}</option>)}
                  </select>
                </label>
              </td>
              <td>
                <div className="dt-archivo">
                  <label className="dt-check" title="Requiere archivo">
                    <input
                      type="checkbox"
                      checked={t.requiresFile}
                      aria-label={`Archivo de ${t.title}`}
                      onChange={(e) => dispatch({ type: 'updateTask', id: t.id, cambios: { requiresFile: e.target.checked } })}
                    />
                  </label>
                  <button
                    type="button"
                    className="btn btn-t dt-borrar"
                    disabled={conArchivos}
                    aria-label={conArchivos ? `${t.title} tiene archivos entregados y no se puede eliminar` : `Eliminar ${t.title}`}
                    title={conArchivos ? 'Tiene archivos entregados: no se puede eliminar' : `Eliminar ${t.title}`}
                    onClick={() => dispatch({ type: 'removeTask', id: t.id })}
                  >
                    <Icono nombre="basura" tam={15} />
                  </button>
                </div>
              </td>
            </tr>
          )
        })}
      </BaseDeDatos>
      {tasks.length > 0 && <p className="dt-nota">{tasks.length} {plural(tasks.length, 'tarea', 'tareas')} · {horas(total)} h</p>}
    </Pagina>
  )
}

function FechaCelda({ tarea, dispatch }: { tarea: Task; dispatch: Dispatch<Accion> }) {
  const errorRef = useRef<HTMLParagraphElement>(null)
  return (
    <div className="dt-celda">
      <input
        className="cel num"
        type="date"
        aria-label={`Fecha límite de ${tarea.title}`}
        value={tarea.dueDate}
        onChange={(e) => {
          const v = e.target.value
          if (errorRef.current) errorRef.current.hidden = fechaValida(v)
          if (fechaValida(v)) dispatch({ type: 'updateTask', id: tarea.id, cambios: { dueDate: v } })
        }}
        onBlur={() => { if (errorRef.current) errorRef.current.hidden = true }}
      />
      <p className="dt-error" role="alert" ref={errorRef} hidden>Elige una fecha completa.</p>
    </div>
  )
}
