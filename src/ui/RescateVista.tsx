import { useMemo, useState } from 'react'
import { analizarRescate, sumarHabiles, type Incidente, type ProposedChange, type RescueScenario, type RuleContext } from '../domain'
import { BaseDeDatos, Callout, Etiqueta, Icono, Pagina, Propiedades } from './bloques'
import { fecha, horas, miembroPorId, plural } from './formato'
import { Avatar } from './IntegrantesVista'
import './rescate.css'

type Props = {
  contexto: RuleContext
  /** Acepta un cambio del plan: lo único que modifica responsables desde esta pantalla. */
  onAplicar: (cambio: ProposedChange) => void
}

const DIAS = [1, 2, 3, 5]

/** Días naturales entre dos fechas ISO (b − a). */
const diasEntre = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000)

/** Modo Rescate y Simulador de Consecuencias: «No intervenir» frente a «Aplicar plan», calculados por el motor. */
export function RescateVista({ contexto, onAplicar }: Props) {
  const { members, tasks, asOf } = contexto
  const abiertas = tasks.filter((t) => t.status !== 'done')
  const [elegida, setElegida] = useState(abiertas[0]?.id ?? '')
  const [dias, setDias] = useState(2)
  const [incidente, setIncidente] = useState<Incidente | null>(null)
  const [vista, setVista] = useState<'sin-intervenir' | 'plan-rescate'>('sin-intervenir')
  const [rechazados, setRechazados] = useState<string[]>([])

  const { sinIntervenir, plan } = useMemo(() => analizarRescate(contexto, incidente ?? undefined), [contexto, incidente])
  const esc = vista === 'sin-intervenir' ? sinIntervenir : plan
  const nombre = (id: string) => miembroPorId(members, id)?.name ?? id
  const titulo = (id: string) => tasks.find((t) => t.id === id)?.title ?? id
  const pendientes = plan.proposedChanges.filter((c) => !rechazados.includes(c.taskId))

  function simular() {
    const t = tasks.find((x) => x.id === elegida)
    if (!t) return
    // El atraso queda ligado a quien la tenía: si la tarea se reasigna, el nuevo responsable no arrastra el atraso.
    setIncidente({ taskId: t.id, ownerId: t.ownerId, hasta: sumarHabiles(asOf, dias) })
    setRechazados([])
    setVista('sin-intervenir')
  }

  if (abiertas.length === 0) {
    return (
      <Pagina icono="escudo" titulo="Rescate">
        <p className="p-parr">No hay tareas abiertas que analizar. Crea tareas en <b>Tareas</b> para usar el simulador.</p>
      </Pagina>
    )
  }

  return (
    <Pagina
      icono="escudo"
      titulo="Rescate"
      propiedades={
        <Propiedades items={[
          { icono: 'calendario', etiqueta: 'Entrega', valor: fecha(esc.deadline) },
          { icono: 'reloj', etiqueta: 'Fin estimado', valor: <span className="num">{esc.estimatedCompletion ? fecha(esc.estimatedCompletion) : 'No se puede estimar'}</span> },
          { icono: 'estado', etiqueta: 'Estado', valor: <Estado esc={esc} /> },
        ]} />
      }
    >
      <p className="p-parr">
        Compara qué pasa si el equipo no hace nada con un plan de rescate calculado con horas, fechas y dependencias.{' '}
        <span className="fa">Nada cambia hasta que aceptes cada cambio.</span>
      </p>

      <section className="r-incidente" aria-label="Simular un atraso">
        {incidente ? (
          <p className="p-nota" role="status">
            <Icono nombre="alerta" tam={14} /> Atraso simulado: <b>{titulo(incidente.taskId)}</b> ({nombre(incidente.ownerId)}) no avanza hasta el {fecha(incidente.hasta)}.{' '}
            <button type="button" className="btn btn-g" onClick={() => { setIncidente(null); setRechazados([]) }}>Quitar atraso</button>
          </p>
        ) : (
          <div className="r-form">
            <span>Simular que</span>
            <label className="sr-only" htmlFor="r-tarea">Tarea que se atrasa</label>
            <select id="r-tarea" className="p-select" value={elegida} onChange={(e) => setElegida(e.target.value)}>
              {abiertas.map((t) => <option key={t.id} value={t.id}>{t.title} ({nombre(t.ownerId)})</option>)}
            </select>
            <span>se atrasa</span>
            <label className="sr-only" htmlFor="r-dias">Días hábiles de atraso</label>
            <select id="r-dias" className="p-select" value={dias} onChange={(e) => setDias(Number(e.target.value))}>
              {DIAS.map((d) => <option key={d} value={d}>{d} {plural(d, 'día hábil', 'días hábiles')}</option>)}
            </select>
            <button type="button" className="btn btn-p" onClick={simular}><Icono nombre="simular" />Simular atraso</button>
          </div>
        )}
      </section>

      <div className="r-toggle" role="group" aria-label="Escenario">
        <button type="button" aria-pressed={vista === 'sin-intervenir'} onClick={() => setVista('sin-intervenir')}>No intervenir</button>
        <button type="button" aria-pressed={vista === 'plan-rescate'} onClick={() => setVista('plan-rescate')}>
          Aplicar plan{plan.proposedChanges.length > 0 && <span className="r-n num">{plan.proposedChanges.length}</span>}
        </button>
      </div>

      <section aria-live="polite" className="r-escenario">
        <p className="p-estado">
          {resumen(esc, sinIntervenir)}{' '}
          <span className="fa">
            {esc.lateTaskIds.length} {plural(esc.lateTaskIds.length, 'tarea tarde', 'tareas tarde')} · {esc.blockedTaskIds.length} {plural(esc.blockedTaskIds.length, 'bloqueada', 'bloqueadas')} ·{' '}
            {esc.overloadedMemberIds.length ? `sobrecarga: ${esc.overloadedMemberIds.map(nombre).join(', ')}` : 'sin sobrecargas'}
          </span>
        </p>

        {esc.warnings.length > 0 && (
          <Callout icono="alerta" tono="amarillo" rol="alert">
            {esc.warnings.map((w) => <p key={w} className="p-parr">{w}</p>)}
          </Callout>
        )}

        <BaseDeDatos
          titulo={vista === 'sin-intervenir' ? 'Si no intervenimos' : 'Con el plan de rescate'}
          columnas={[
            { icono: 'texto', nombre: 'Tarea' },
            { icono: 'persona', nombre: 'Responsable' },
            { icono: 'flecha', nombre: 'Depende de' },
            { icono: 'numero', nombre: 'Horas' },
            { icono: 'reloj', nombre: 'Termina (est.)' },
            { icono: 'calendario', nombre: 'Límite' },
            { icono: 'estado', nombre: 'Estado' },
          ]}
        >
          {esc.tasks.filter((t) => t.status !== 'done').map((t) => {
            const antes = tasks.find((x) => x.id === t.id)!
            const fin = esc.taskFinish[t.id]
            const cambia = antes.ownerId !== t.ownerId
            return (
              <tr key={t.id}>
                <td>{t.title}</td>
                <td>
                  <span className="p-persona">
                    {cambia && <><Avatar nombre={nombre(antes.ownerId)} indice={members.findIndex((m) => m.id === antes.ownerId)} />{nombre(antes.ownerId)}<Icono nombre="flecha" tam={12} /></>}
                    <Avatar nombre={nombre(t.ownerId)} indice={members.findIndex((m) => m.id === t.ownerId)} />{nombre(t.ownerId)}
                    {cambia && <Etiqueta color="morado">Propuesto</Etiqueta>}
                  </span>
                </td>
                <td className="fa">{t.dependsOn?.length ? t.dependsOn.map(titulo).join(', ') : '—'}</td>
                <td className="num">{horas(t.estimatedHours)} h</td>
                <td className="num">{fin ? fecha(fin) : 'Sin estimar'}</td>
                <td className="num">{fecha(t.dueDate)}</td>
                <td><EstadoTarea id={t.id} esc={esc} incidente={incidente} dueDate={t.dueDate} /></td>
              </tr>
            )
          })}
        </BaseDeDatos>

        {vista === 'plan-rescate' && (
          <section className="n-bd" aria-labelledby="h-cambios">
            <h2 id="h-cambios" className="n-bd-tit">Cambios propuestos</h2>
            {plan.proposedChanges.length === 0 ? (
              <p className="p-parr fa">
                {sinIntervenir.lateTaskIds.length === 0 ? 'No hace falta rescatar nada: con la distribución actual se entrega a tiempo.' : 'No hay una redistribución que ayude sin sobrecargar a alguien.'}
              </p>
            ) : (
              <ul className="r-lista">
                {pendientes.map((c) => (
                  <li key={c.taskId} className="r-fila">
                    <span>Pasar <b>{titulo(c.taskId)}</b> de {nombre(c.fromMemberId)} a <b>{nombre(c.toMemberId)}</b> <span className="fa">· {c.motivo}</span></span>
                    <span className="r-detalle r-acciones">
                      <button type="button" className="btn btn-p" onClick={() => onAplicar(c)}><Icono nombre="check" />Aceptar</button>
                      <button type="button" className="btn btn-g" onClick={() => setRechazados([...rechazados, c.taskId])}>Rechazar</button>
                    </span>
                  </li>
                ))}
                {rechazados.length > 0 && <li className="r-fila fa">Rechazaste {rechazados.length} {plural(rechazados.length, 'cambio', 'cambios')}; esas tareas siguen como están.</li>}
              </ul>
            )}
          </section>
        )}

        <p className="p-nota fa">
          Supuesto: las horas disponibles de cada quien se reparten por igual entre los días hábiles hasta la entrega, y una tarea empieza el día después de que terminan sus dependencias. Son estimaciones, no garantías.
        </p>
      </section>
    </Pagina>
  )
}

function resumen(esc: RescueScenario, base: RescueScenario) {
  if (!esc.estimatedCompletion) return 'No se puede estimar la fecha de término.'
  const tarde = diasEntre(esc.deadline, esc.estimatedCompletion)
  const texto = tarde > 0 ? `Terminaría el ${fecha(esc.estimatedCompletion)}, ${tarde} ${plural(tarde, 'día', 'días')} después de la entrega.` : `Se entrega a tiempo: termina el ${fecha(esc.estimatedCompletion)}.`
  if (esc.scenarioId === 'plan-rescate' && base.estimatedCompletion && base.estimatedCompletion !== esc.estimatedCompletion) {
    return `${texto} Sin intervenir: ${fecha(base.estimatedCompletion)}.`
  }
  return texto
}

function Estado({ esc }: { esc: RescueScenario }) {
  if (!esc.datosCompletos || !esc.estimatedCompletion) return <Etiqueta color="gris">Sin datos suficientes</Etiqueta>
  return esc.feasible ? <Etiqueta color="verde">A tiempo</Etiqueta> : <Etiqueta color="rojo">En riesgo</Etiqueta>
}

function EstadoTarea({ id, esc, incidente, dueDate }: { id: string; esc: RescueScenario; incidente: Incidente | null; dueDate: string }) {
  const fin = esc.taskFinish[id]
  const atrasada = incidente?.taskId === id && esc.tasks.find((t) => t.id === id)?.ownerId === incidente.ownerId
  return (
    <span className="r-estado">
      {atrasada && <Etiqueta color="naranja">Atrasada</Etiqueta>}
      {esc.blockedTaskIds.includes(id) && <Etiqueta color="rojo">Bloqueada</Etiqueta>}
      {!fin ? <Etiqueta color="gris">Sin estimar</Etiqueta> : fin > dueDate ? <Etiqueta color="rojo">Tarde</Etiqueta> : <Etiqueta color="verde">A tiempo</Etiqueta>}
    </span>
  )
}
