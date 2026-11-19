import { useMemo, useState } from 'react'
import { calculateLoads, isTaskOverdue, simulateAssignment, type Member, type RuleContext, type Task } from '../domain'
import { serieEquilibrio, type Decision } from '../delivery/acta'
import { GraficaEquilibrio } from './GraficaEquilibrio'
import { Resiliencia } from './Resiliencia'
import { BarraCarga, BaseDeDatos, Callout, Checklist, Cifra, Etiqueta, Icono, Pagina, Propiedades, Toggle } from './bloques'
import { equilibrio } from './equilibrio'
import { COLOR_RIESGO, ESTADO_TAREA, fecha, horas, miembroPorId, pct, plural, type PaginaId } from './formato'
import './paginas.css'

type Props = {
  proyecto: string
  members: readonly Member[]
  tasks: readonly Task[]
  /** Contexto de reglas (incluye la ausencia) para el índice de equilibrio. */
  contexto: RuleContext
  /** Bitácora: alimenta la gráfica del equilibrio en el tiempo. */
  decisiones: readonly Decision[]
  onIr: (pagina: PaginaId) => void
}

/** Recuerda durante la sesión que ya se simuló (la vista se desmonta al cambiar de página). */
const CLAVE_SIM = 'tg-simulo'
const leerSimulo = () => { try { return sessionStorage.getItem(CLAVE_SIM) === '1' } catch { return false } }
const guardarSimulo = () => { try { sessionStorage.setItem(CLAVE_SIM, '1') } catch { /* sin almacenamiento */ } }

function Avatar({ member, members, chico }: { member: Member; members: readonly Member[]; chico?: boolean }) {
  const i = (members.findIndex((m) => m.id === member.id) % 3) + 1
  return <span className={`av av${i}${chico ? ' av-s' : ''}`} aria-hidden="true">{member.name[0]}</span>
}

export function TableroVista({ proyecto, members, tasks, contexto, decisiones, onIr }: Props) {
  const abiertas = tasks.filter((t) => t.status !== 'done')
  const [sim, setSim] = useState<{ taskId: string; candidateId: string } | null>(null)
  const [simulado, setSimulado] = useState(leerSimulo)

  const cargas = useMemo(() => calculateLoads(members, tasks), [members, tasks])
  const simulacion = useMemo(() => {
    if (!sim) return null
    const tarea = tasks.find((t) => t.id === sim.taskId)
    if (!tarea || tarea.status === 'done' || tarea.ownerId === sim.candidateId) return null
    return simulateAssignment(members, tasks, sim.taskId, sim.candidateId)
  }, [sim, members, tasks])

  if (members.length === 0 || tasks.length === 0) {
    const pasos = [members.length > 0, tasks.length > 0, simulado].filter(Boolean).length
    return (
      <Pagina icono="tablero" titulo={`Bienvenido a ${proyecto}`}>
        <p className="p-parr">Aquí verás quién carga cuánto trabajo y si alguien se pasa de su disponibilidad. Empieza con tres pasos.</p>
        <p className="p-progreso num" aria-live="polite">{pasos} de 3 pasos</p>
        <Checklist items={[
          { texto: 'Agrega integrantes', hecho: members.length > 0, accion: { texto: 'Ir a Integrantes', onClick: () => onIr('integrantes') } },
          { texto: 'Crea tareas', hecho: tasks.length > 0, accion: { texto: 'Ir a Tareas', onClick: () => onIr('tareas') } },
          { texto: 'Simula una asignación', hecho: simulado },
        ]} />
        <Toggle titulo="¿Qué es la carga?">
          <p className="p-parr">Es la suma de horas de tus tareas abiertas frente a las horas que tienes disponibles. Al 100 % vas justo; arriba de eso hay sobrecarga y conviene repartir distinto.</p>
        </Toggle>
      </Pagina>
    )
  }

  const libres = cargas.reduce((s, c) => s + c.remainingHours, 0)
  const entrega = abiertas.map((t) => t.dueDate).sort().at(-1)

  const proyectadas = simulacion?.projectedLoads
  const tareaSim = simulacion && tasks.find((t) => t.id === simulacion.taskId)
  const sobreSim = proyectadas?.filter((c) => c.status === 'overloaded') ?? []
  // Alguien con espacio que no es el dueño actual ni el candidato.
  const libre = simulacion && tareaSim && cargas.find((c) =>
    c.memberId !== simulacion.currentOwnerId && c.memberId !== simulacion.candidateId &&
    c.status === 'normal' && c.remainingHours >= tareaSim.estimatedHours)
  const alternativa = libre ? `${miembroPorId(members, libre.memberId)?.name} tiene ${horas(libre.remainingHours)} h libres. ` : ''

  function abrirSimulacion() {
    const tarea = abiertas[0]
    const otro = tarea && members.find((m) => m.id !== tarea.ownerId)
    if (!tarea || !otro) return
    guardarSimulo()
    setSimulado(true)
    setSim({ taskId: tarea.id, candidateId: otro.id })
  }

  function cambiarTarea(taskId: string) {
    const tarea = tasks.find((t) => t.id === taskId)
    if (!tarea || !sim) return
    const candidato = sim.candidateId === tarea.ownerId ? members.find((m) => m.id !== tarea.ownerId)?.id : sim.candidateId
    if (candidato) setSim({ taskId, candidateId: candidato })
  }

  const tareasSim = simulacion ? tasks.map((t) => (t.id === simulacion.taskId ? { ...t, ownerId: simulacion.candidateId } : t)) : tasks
  const tareasDe = (id: string) => tareasSim.filter((t) => t.ownerId === id && t.status !== 'done')
  const eq = equilibrio(contexto)
  const nombres = (ids: readonly string[]) => ids.map((id) => miembroPorId(members, id)?.name ?? id).join(' y ')
  // La frase sale del mismo cálculo que el equilibrio y el riesgo, para que nunca se contradigan.
  const problemas = [
    eq.sinCubrir.length > 0 && `${eq.sinCubrir.map((t) => `${t.title} (${horas(t.estimatedHours)} h)`).join(', ')} no ${plural(eq.sinCubrir.length, 'tiene', 'tienen')} quién la cubra durante la ausencia`,
    eq.sobrecargados.length > 0 && `${nombres(eq.sobrecargados)} ${plural(eq.sobrecargados.length, 'pasa', 'pasan')} de su disponibilidad`,
  ].filter(Boolean)
  const vencidas = abiertas.filter((t) => isTaskOverdue(t, contexto.asOf))
  const eqSim = simulacion ? equilibrio({ ...contexto, tasks: tareasSim }) : null

  return (
    <Pagina
      icono="tablero"
      titulo="Tablero"
      propiedades={
        <Propiedades items={[
          { icono: 'escudo', etiqueta: 'Equilibrio', valor: (
            <span className="num" title="Porcentaje de las horas abiertas que caben en el tiempo real de su responsable">
              {eqSim && eqSim.indice !== eq.indice ? <>{eq.indice} → <b><Cifra desde={eq.indice} valor={eqSim.indice} /></b></> : eq.indice}/100
              <span className="fa"> · {horas((eqSim ?? eq).caben)} de {horas((eqSim ?? eq).total)} h caben</span>
            </span>
          ) },
          { icono: 'estado', etiqueta: 'Riesgo', valor: <Etiqueta color={COLOR_RIESGO[eq.riesgo]}>{eq.riesgo}</Etiqueta> },
          { icono: 'calendario', etiqueta: 'Entrega', valor: entrega ? fecha(entrega) : '—' },
          { icono: 'personas', etiqueta: 'Integrantes', valor: (
            <span className="p-persona">
              <span className="p-pila">{members.map((m) => <Avatar key={m.id} member={m} members={members} />)}</span>
              <span className="fa num">{members.length}</span>
            </span>
          ) },
          { icono: 'reloj', etiqueta: 'Horas libres', valor: <span className="num">{horas(libres)} h</span> },
        ]} />
      }
    >
      <p className="p-estado">
        {problemas.length > 0 ? 'Hay trabajo que no cabe.' : 'Todo en orden.'}{' '}
        <span className="fa">{problemas.length > 0 ? `${problemas.join('; ')}.` : 'Nadie está sobrecargado.'}</span>
      </p>
      {vencidas.length > 0 && (
        <p className="p-nota" role="status">
          <Icono nombre="alerta" tam={14} /> {vencidas.length} {plural(vencidas.length, 'tarea vencida', 'tareas vencidas')} sin terminar: {vencidas.map((t) => `${t.title} (venció el ${fecha(t.dueDate)})`).join(', ')}.
        </p>
      )}

      {!sim && (
        <div className="p-acciones">
          <button type="button" className="btn btn-p" onClick={abrirSimulacion} disabled={abiertas.length === 0 || members.length < 2}>
            <Icono nombre="simular" />Simular asignación
          </button>
        </div>
      )}

      {sim && (
        <Callout icono="simular" tono={sobreSim.length > 0 ? 'amarillo' : 'n'} rol="status">
          <p className="p-frase">
            Si
            <label className="sr-only" htmlFor="sim-tarea">Tarea</label>
            <select id="sim-tarea" className="p-select" value={sim.taskId} onChange={(e) => cambiarTarea(e.target.value)}>
              {abiertas.map((t) => <option key={t.id} value={t.id}>{t.title} · {horas(t.estimatedHours)} h</option>)}
            </select>
            pasa a
            <label className="sr-only" htmlFor="sim-quien">Asignar a</label>
            <select id="sim-quien" className="p-select" value={sim.candidateId} onChange={(e) => setSim({ ...sim, candidateId: e.target.value })}>
              {members.filter((m) => m.id !== tasks.find((t) => t.id === sim.taskId)?.ownerId).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </p>
          <p className="p-parr">
            {sobreSim.length > 0
              ? `${sobreSim.map((c) => `${miembroPorId(members, c.memberId)?.name} pasaría a ${horas(c.assignedHours)} de ${horas(c.availableHours)} h (${pct(c.percentage)})`).join('; ')}. ${eqSim && eqSim.indice < eq.indice ? `El equilibrio bajaría de ${eq.indice} a ${eqSim.indice}. ` : ''}${alternativa}Nada cambia hasta que alguien lo decida.`
              : 'Cabe sin sobrecargar a nadie. Nada cambia hasta que alguien lo decida.'}
          </p>
          <div className="p-acciones">
            <button type="button" className="btn btn-s" onClick={() => setSim(null)}><Icono nombre="x" />Cancelar simulación</button>
          </div>
        </Callout>
      )}

      {members.length > 1 && <Resiliencia contexto={contexto} />}

      {decisiones.length > 0 && (
        <section className="n-bd">
          <h2 className="n-bd-tit">Equilibrio en el tiempo</h2>
          <GraficaEquilibrio puntos={serieEquilibrio(decisiones)} />
        </section>
      )}

      <BaseDeDatos
        titulo="Carga del equipo"
        columnas={[
          { icono: 'persona', nombre: 'Integrante' },
          { icono: 'texto', nombre: 'Tareas abiertas' },
          { icono: 'numero', nombre: 'Horas' },
          { icono: 'estado', nombre: 'Carga' },
        ]}
      >
        {members.map((m) => {
          const real = cargas.find((c) => c.memberId === m.id)!
          const vista = proyectadas?.find((c) => c.memberId === m.id) ?? real
          const cambia = vista.assignedHours !== real.assignedHours
          const propias = tareasDe(m.id)
          return (
            <tr key={m.id}>
              <td><span className="p-persona"><Avatar member={m} members={members} chico />{m.name}</span></td>
              <td className="p-tareas-lista">{propias.length ? propias.map((t) => t.title).join(', ') : 'Sin tareas'}</td>
              <td className="num">{cambia ? `${horas(real.assignedHours)} → ${horas(vista.assignedHours)}` : horas(vista.assignedHours)} h</td>
              <td>
                <div className="p-carga">
                  <BarraCarga asignadas={vista.assignedHours} disponibles={vista.availableHours} />
                </div>
              </td>
            </tr>
          )
        })}
      </BaseDeDatos>

      <BaseDeDatos
        titulo="Tareas"
        columnas={[
          { icono: 'texto', nombre: 'Tarea' },
          { icono: 'persona', nombre: 'Responsable' },
          { icono: 'numero', nombre: 'Horas' },
          { icono: 'calendario', nombre: 'Fecha límite' },
          { icono: 'estado', nombre: 'Estado' },
        ]}
      >
        {tasks.map((t) => {
          const dueno = miembroPorId(members, t.ownerId)
          const simulada = simulacion?.taskId === t.id
          const nuevo = simulada ? miembroPorId(members, simulacion.candidateId) : undefined
          const est = ESTADO_TAREA[t.status]
          return (
            <tr key={t.id} className={simulada ? 'p-sim' : undefined}>
              <td>{t.title}</td>
              <td>
                <span className="p-persona">
                  {dueno && <Avatar member={dueno} members={members} chico />}{dueno?.name ?? t.ownerId}
                  {nuevo && <><span className="p-flecha"><Icono nombre="flecha" tam={12} /></span><Avatar member={nuevo} members={members} chico />{nuevo.name}<Etiqueta color="morado">Simulado</Etiqueta></>}
                </span>
              </td>
              <td className="num">{horas(t.estimatedHours)} h</td>
              <td className="num">{fecha(t.dueDate)}</td>
              <td><Etiqueta color={est.color}>{est.texto}</Etiqueta>{isTaskOverdue(t, contexto.asOf) && <> <Etiqueta color="rojo">Vencida</Etiqueta></>}</td>
            </tr>
          )
        })}
      </BaseDeDatos>
      <button type="button" className="btn btn-g p-enlace p-suelto" onClick={() => onIr('tareas')}>Editar en Tareas</button>
    </Pagina>
  )
}
