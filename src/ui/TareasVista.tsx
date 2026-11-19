import { useTextos } from './version'
import { useEffect, useId, useRef, useState, type Dispatch } from 'react'
import { DEMO_DATE, isTaskOverdue, type Member, type Task } from '../domain'
import type { Entrega } from '../delivery/zip'
import type { Accion } from './estado'
import { BaseDeDatos, Callout, Etiqueta, Icono, Pagina, Propiedades } from './bloques'
import { ahora, ESTADO_TAREA, fechaValida, horas, horasValidas, nombreValido, plural, type PaginaId } from './formato'
import { Avatar, CeldaTexto, Guardado, useGuardado } from './IntegrantesVista'
import { Ayuda } from './ayuda'
import { useAvisos } from './avisos'
import './datos.css'

type Props = {
  members: readonly Member[]
  tasks: readonly Task[]
  files: readonly Entrega[]
  dispatch: Dispatch<Accion>
  /** Navega a otra página (para «Ir a Integrantes»). */
  onIr?: (p: PaginaId) => void
}

const ESTADOS = Object.keys(ESTADO_TAREA) as Task['status'][]
const leerHoras = (s: string) => (s.trim() === '' ? NaN : Number(s.trim().replace(',', '.')))
const FECHA_INICIAL = '2026-11-20'
const HORAS_MIN = 0.5
const HORAS_MAX = 40
const FECHA_MIN = '2020-01-01'
const FECHA_MAX = '2099-12-31'
const msgTitulo = (v: string) => (nombreValido(v) ? null : 'Escribe el nombre de la tarea; no puede quedar vacío.')
const msgHoras = (v: string) => {
  const h = leerHoras(v)
  const ok = horasValidas(h) && h >= HORAS_MIN && h <= HORAS_MAX && Number.isInteger(h * 2)
  return ok ? null : `Escribe horas entre ${HORAS_MIN} y ${HORAS_MAX}, de media en media hora (por ejemplo 2 o 2.5).`
}

export function TareasVista({ members, tasks, files, dispatch, onIr }: Props) {
  const t = useTextos()
  const { avisar } = useAvisos()
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
    avisar({ texto: 'Tarea agregada: ponle nombre, horas y responsable.' })
  }
  const cambiarResponsable = (tarea: Task, ownerId: string) => {
    const antes = tarea.ownerId
    const nombre = (id: string) => members.find((m) => m.id === id)?.name ?? 'nadie'
    dispatch({ type: 'reassignTask', id: tarea.id, ownerId, hora: ahora() })
    avisar({
      texto: `${tarea.title} pasó de ${nombre(antes)} a ${nombre(ownerId)}.`,
      deshacer: () => dispatch({ type: 'reassignTask', id: tarea.id, ownerId: antes, hora: ahora() }),
    })
  }
  const eliminar = (tarea: Task, indice: number) => {
    dispatch({ type: 'removeTask', id: tarea.id })
    avisar({ texto: `Se eliminó «${tarea.title}».`, deshacer: () => dispatch({ type: 'restoreTask', task: tarea, index: indice }) })
  }

  return (
    <Pagina
      icono="tareas"
      titulo="Tareas"
      propiedades={<Propiedades items={[
        { icono: 'estado', etiqueta: 'Abiertas', valor: <span className="num">{abiertas}</span> },
        { icono: 'check', etiqueta: 'Completadas', valor: <span className="num">{completadas}</span> },
        { icono: 'reloj', etiqueta: 'Horas totales', valor: <span className="num">{horas(total)} h</span> },
      ]} />}
    >
      {members.length === 0 ? (
        <Callout icono="info">
          <p className="dt-callout-p">{t.primeroIntegrantes}</p>
          {onIr && <button type="button" className="btn btn-s" onClick={() => onIr('integrantes')}><Icono nombre="integrantes" tam={14} />Ir a {t.integrantes}</button>}
        </Callout>
      ) : tasks.length === 0 && (
        <Callout icono="info">{t.vacioTareas}</Callout>
      )}
      <BaseDeDatos
        columnas={[
          { icono: 'texto', nombre: 'Tarea' },
          { icono: 'persona', nombre: 'Responsable', ancho: '124px' },
          { icono: 'numero', nombre: 'Horas', ancho: '84px' },
          { icono: 'calendario', nombre: 'Fecha límite', ancho: '136px' },
          { icono: 'estado', nombre: 'Estado', ancho: '118px' },
          { icono: 'check', nombre: 'Requiere archivo', ancho: '112px', ayuda: <Ayuda tema="requiere archivo">Marca las tareas que deben entregarse con un archivo. El ZIP final se habilita cuando todas esas tareas tienen el suyo.</Ayuda> },
        ]}
        textoNueva="Nueva tarea"
        onNueva={members.length > 0 ? nueva : undefined}
      >
        {tasks.map((t, i) => {
          const dueno = members.findIndex((m) => m.id === t.ownerId)
          const ultima = i === tasks.length - 1
          const conArchivos = files.some((f) => f.taskId === t.id)
          return (
            <tr key={t.id} className="dt-fila">
              <td>
                <CeldaTexto
                  valor={t.title}
                  etiqueta={`Título de ${t.title}`}
                  entradaRef={ultima ? (el) => { nuevaRef.current = el } : undefined}
                  validar={msgTitulo}
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
                    onChange={(e) => cambiarResponsable(t, e.target.value)}
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
                  validar={msgHoras}
                  onGuardar={(v) => dispatch({ type: 'updateTask', id: t.id, cambios: { estimatedHours: leerHoras(v) } })}
                />
              </td>
              <td>
                <FechaCelda tarea={t} dispatch={dispatch} />
              </td>
              <td>
                <EstadoCelda tarea={t} dispatch={dispatch} />
              </td>
              <td>
                <div className="dt-archivo">
                  <label className="dt-check" title="Requiere archivo">
                    <input
                      type="checkbox"
                      checked={t.requiresFile}
                      aria-label={`Requiere archivo: ${t.title}`}
                      onChange={(e) => dispatch({ type: 'updateTask', id: t.id, cambios: { requiresFile: e.target.checked } })}
                    />
                  </label>
                  <button
                    type="button"
                    className="btn btn-t dt-borrar"
                    disabled={conArchivos}
                    aria-label={conArchivos ? `${t.title} tiene archivos entregados y no se puede eliminar` : `Eliminar ${t.title}`}
                    title={conArchivos ? 'Tiene archivos entregados: no se puede eliminar' : `Eliminar ${t.title}`}
                    onClick={() => eliminar(t, i)}
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

function EstadoCelda({ tarea, dispatch }: { tarea: Task; dispatch: Dispatch<Accion> }) {
  const [visto, marcar] = useGuardado()
  const est = ESTADO_TAREA[tarea.status]
  return (
    <div className="dt-celda">
      <label className="dt-estado">
        <Etiqueta color={est.color}>{est.texto}</Etiqueta>
        <select
          className="dt-estado-sel"
          aria-label={`Estado de ${tarea.title}`}
          value={tarea.status}
          onChange={(e) => { dispatch({ type: 'updateTask', id: tarea.id, cambios: { status: e.target.value as Task['status'] } }); marcar() }}
        >
          {ESTADOS.map((s) => <option key={s} value={s}>{ESTADO_TAREA[s].texto}</option>)}
        </select>
      </label>
      <Guardado visto={visto} />
    </div>
  )
}

/** Fecha límite: si lo escrito está incompleto se conserva y se explica; Escape vuelve a la fecha guardada. */
function FechaCelda({ tarea, dispatch }: { tarea: Task; dispatch: Dispatch<Accion> }) {
  const [borrador, setBorrador] = useState<string | null>(null)
  const [visto, marcar] = useGuardado()
  const idError = useId()
  const valor = borrador ?? tarea.dueDate
  const error = borrador !== null && !fechaValida(borrador) ? 'Elige una fecha completa: día, mes y año.' : null
  const vencida = !error && isTaskOverdue(tarea, DEMO_DATE)
  return (
    <div className="dt-celda">
      <input
        className="cel num"
        type="date"
        min={FECHA_MIN}
        max={FECHA_MAX}
        aria-label={`Fecha límite de ${tarea.title}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? idError : undefined}
        value={valor}
        onChange={(e) => {
          const v = e.target.value
          if (fechaValida(v)) {
            setBorrador(null)
            if (v !== tarea.dueDate) { dispatch({ type: 'updateTask', id: tarea.id, cambios: { dueDate: v } }); marcar() }
          } else setBorrador(v)
        }}
        onKeyDown={(e) => { if (e.key === 'Escape') setBorrador(null) }}
      />
      <Guardado visto={visto} />
      {error && <p className="dt-error" id={idError} role="alert">{error}</p>}
      {vencida && <span className="dt-vencida">Vencida</span>}
    </div>
  )
}
