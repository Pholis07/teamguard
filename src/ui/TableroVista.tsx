import { useMemo, useState } from 'react'
import { calculateLoads, simulateAssignment, type Member, type Task } from '../domain'
import {
  Avatar, Callout, CargaFila, ChipRiesgo, EstadoTarea, Icono, Propiedades,
  type Riesgo,
} from './piezas'
import { fecha, horas, miembroPorId, pct, plural } from './formato'

type Props = { members: readonly Member[]; tasks: readonly Task[] }

/** Tablero: cargas reales y simulación local. Simular nunca modifica las tareas compartidas. */
export function TableroVista({ members, tasks }: Props) {
  const abiertas = tasks.filter((t) => t.status !== 'done')
  const [sim, setSim] = useState<{ taskId: string; candidateId: string } | null>(null)

  const cargas = useMemo(() => calculateLoads(members, tasks), [members, tasks])
  const simulacion = useMemo(() => {
    if (!sim) return null
    const tarea = tasks.find((t) => t.id === sim.taskId)
    if (!tarea || tarea.status === 'done' || tarea.ownerId === sim.candidateId) return null
    return simulateAssignment(members, tasks, sim.taskId, sim.candidateId)
  }, [sim, members, tasks])

  const sobrecargados = cargas.filter((c) => c.status === 'overloaded')
  const riesgo: Riesgo = sobrecargados.length > 0 ? 'Alto' : 'Bajo'
  const asignadas = cargas.reduce((s, c) => s + c.assignedHours, 0)
  const disponibles = members.reduce((s, m) => s + m.availableHours, 0)
  const libres = cargas.reduce((s, c) => s + c.remainingHours, 0)
  const entrega = abiertas.map((t) => t.dueDate).sort().at(-1)
  const nombres = (ids: string[]) => ids.map((id) => miembroPorId(members, id)?.name ?? id).join(' y ')

  const proyectadas = simulacion?.projectedLoads
  const tareaSim = simulacion && tasks.find((t) => t.id === simulacion.taskId)
  const sobreSim = proyectadas?.filter((c) => c.status === 'overloaded') ?? []
  // Sugerencia sin culpa: alguien más (ni el dueño ni el candidato) que sí tiene espacio.
  const libreSim = simulacion && tareaSim && cargas.find((c) =>
    c.memberId !== simulacion.currentOwnerId && c.memberId !== simulacion.candidateId &&
    c.status === 'normal' && c.remainingHours >= tareaSim.estimatedHours)
  const alternativa = libreSim ? { nombre: miembroPorId(members, libreSim.memberId)?.name, libres: libreSim.remainingHours } : null

  function abrirSimulacion() {
    const tarea = abiertas[0]
    const otro = tarea && members.find((m) => m.id !== tarea.ownerId)
    if (tarea && otro) setSim({ taskId: tarea.id, candidateId: otro.id })
  }

  function cambiarTarea(taskId: string) {
    const tarea = tasks.find((t) => t.id === taskId)
    if (!tarea || !sim) return
    const candidato = sim.candidateId === tarea.ownerId ? members.find((m) => m.id !== tarea.ownerId)?.id : sim.candidateId
    if (candidato) setSim({ taskId, candidateId: candidato })
  }

  return (
    <>
      <header className="pagina">
        <h1>
          {riesgo === 'Alto' ? (
            <>Hay sobrecarga. <span className="fa">{nombres(sobrecargados.map((c) => c.memberId))} {plural(sobrecargados.length, 'pasa', 'pasan')} de su disponibilidad.</span></>
          ) : (
            <>Todo en orden. <span className="fa">{entrega ? `Entregan el ${fecha(entrega)} y nadie está sobrecargado.` : 'No hay tareas abiertas.'}</span></>
          )}
        </h1>
        <div className="pagina-pie">
          <Propiedades items={[
            { icono: 'estado', etiqueta: 'Riesgo', valor: <ChipRiesgo riesgo={riesgo} /> },
            { icono: 'calendario', etiqueta: 'Entrega', valor: entrega ? fecha(entrega) : '—' },
            { icono: 'personas', etiqueta: 'Integrantes', valor: (
              <span className="pila">{members.map((m) => <Avatar key={m.id} member={m} members={members} chico />)}<span>{members.length}</span></span>
            ) },
          ]} />
          {!sim && (
            <button className="btn btn-p" onClick={abrirSimulacion} disabled={abiertas.length === 0 || members.length < 2}>
              <Icono nombre="simular" />Simular asignación
            </button>
          )}
        </div>
      </header>

      <section aria-label="Resumen" className="metricas">
        <div><span className="fa">Horas asignadas</span><span className="num metrica">{horas(asignadas)}<span className="fa"> / {horas(disponibles)} h</span></span></div>
        <div><span className="fa">Horas libres</span><span className="num metrica">{horas(libres)}<span className="fa"> h</span></span></div>
        <div><span className="fa">Tareas abiertas</span><span className="num metrica">{abiertas.length}</span></div>
        <div><span className="fa">Con sobrecarga</span><span className="num metrica">{sobrecargados.length}</span></div>
      </section>

      {sim && (
        <section aria-labelledby="h-sim" className="bloque">
          <Callout icono="simular" tono={sobreSim.length > 0 ? 'wa' : 'n'} rol="status">
            <h2 id="h-sim" className="callout-titulo">Simulación</h2>
            <p className="frase">
              Si
              <label className="sr-only" htmlFor="sim-tarea">Tarea</label>
              <select id="sim-tarea" className="campo" value={sim.taskId} onChange={(e) => cambiarTarea(e.target.value)}>
                {abiertas.map((t) => <option key={t.id} value={t.id}>{t.title} · {horas(t.estimatedHours)} h</option>)}
              </select>
              pasa a
              <label className="sr-only" htmlFor="sim-quien">Asignar a</label>
              <select id="sim-quien" className="campo" value={sim.candidateId} onChange={(e) => setSim({ ...sim, candidateId: e.target.value })}>
                {members.filter((m) => m.id !== tasks.find((t) => t.id === sim.taskId)?.ownerId).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </p>
            {sobreSim.length > 0 && proyectadas ? (
              <p className="callout-texto">
                {sobreSim.map((c) => `${miembroPorId(members, c.memberId)?.name} pasaría a ${horas(c.assignedHours)} de ${horas(c.availableHours)} h (${pct(c.percentage)})`).join('; ')}.{' '}
                {alternativa && `${alternativa.nombre} tiene ${horas(alternativa.libres)} h libres. `}
                Nada cambia hasta que alguien lo decida.
              </p>
            ) : (
              <p className="callout-texto">Cabe sin sobrecargar a nadie. Nada cambia hasta que alguien lo decida.</p>
            )}
            <div className="acciones">
              <button className="btn btn-s" onClick={() => setSim(null)}><Icono nombre="x" />Cancelar simulación</button>
            </div>
          </Callout>
        </section>
      )}

      <section aria-labelledby="h-carga" className="bloque">
        <div className="bloque-cabeza">
          <h2 id="h-carga">Carga del equipo</h2>
          <span className="fa leyenda"><span className="leyenda-marca" />marca = disponibilidad hasta la entrega</span>
        </div>
        <div className="panel lista">
          {members.map((m) => {
            const real = cargas.find((c) => c.memberId === m.id)!
            const vista = proyectadas?.find((c) => c.memberId === m.id) ?? real
            const propias = (simulacion
              ? tasks.map((t) => (t.id === simulacion.taskId ? { ...t, ownerId: simulacion.candidateId } : t))
              : tasks
            ).filter((t) => t.ownerId === m.id && t.status !== 'done')
            return (
              <CargaFila
                key={m.id}
                member={m}
                members={members}
                load={vista}
                antes={simulacion ? real : undefined}
                detalle={propias.length ? propias.map((t) => t.title).join(', ') : 'Sin tareas'}
              />
            )
          })}
        </div>
      </section>

      <section aria-labelledby="h-tareas" className="bloque">
        <div className="bloque-cabeza">
          <h2 id="h-tareas">Tareas</h2>
          <span className="vista-tab"><Icono nombre="tabla" tam={14} />Tabla</span>
        </div>
        <div className="db-marco">
          <table className="db">
            <thead>
              <tr>
                <th><Icono nombre="texto" tam={13} />Tarea</th>
                <th><Icono nombre="persona" tam={13} />Responsable</th>
                <th><Icono nombre="reloj" tam={13} />Horas</th>
                <th><Icono nombre="calendario" tam={13} />Fecha límite</th>
                <th><Icono nombre="estado" tam={13} />Estado</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => {
                const dueno = miembroPorId(members, t.ownerId)
                const simulada = simulacion?.taskId === t.id
                const nuevo = simulada ? miembroPorId(members, simulacion.candidateId) : undefined
                return (
                  <tr key={t.id} className={simulada ? 'fila-sim' : undefined}>
                    <td className="db-titulo">{t.title}</td>
                    <td>
                      <span className="persona">
                        {dueno && <Avatar member={dueno} members={members} chico />}{dueno?.name ?? t.ownerId}
                        {nuevo && <><Icono nombre="flecha" tam={12} /><Avatar member={nuevo} members={members} chico />{nuevo.name}<span className="chip c-a">Simulado</span></>}
                      </span>
                    </td>
                    <td className="num">{horas(t.estimatedHours)} h</td>
                    <td className="mu">{fecha(t.dueDate)}</td>
                    <td><EstadoTarea status={t.status} /></td>
                  </tr>
                )
              })}
              {tasks.length === 0 && (
                <tr><td colSpan={5} className="fa db-vacio">Todavía no hay tareas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
