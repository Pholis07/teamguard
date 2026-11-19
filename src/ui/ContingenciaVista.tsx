import { useMemo, useState } from 'react'
import {
  DEMO_ABSENCE, calculateLoads, getCoverageCandidates, getTasksNeedingCoverage,
  proposeCoverage, rejectProposal,
  type Absence, type CoverageProposal, type RuleContext,
} from '../domain'
import {
  Avatar, Callout, CargaFila, ChipRiesgo, Icono, Propiedades,
  type Riesgo,
} from './piezas'
import { fecha, horas, miembroPorId, plural, rango } from './formato'

type Props = {
  contexto: RuleContext
  absence: Absence | null
  onSetAbsence: (absence: Absence | null) => void
  /** Lo ÚNICO que reasigna: la integración confirma la propuesta contra el estado actual. */
  onAccept: (proposal: CoverageProposal) => void
}

type Modo = 'propuesta' | 'editar' | 'rechazada'

export function ContingenciaVista({ contexto, absence, onSetAbsence, onAccept }: Props) {
  const { members, tasks } = contexto
  const [modo, setModo] = useState<Modo>('propuesta')
  const [candidato, setCandidato] = useState<string | undefined>(undefined)
  const [cubierta, setCubierta] = useState<{ tarea: string; quien: string; carga: string } | null>(null)

  const pendientes = useMemo(() => (absence ? getTasksNeedingCoverage(contexto) : []), [absence, contexto])
  const tarea = pendientes[0]
  const resultado = useMemo(
    () => (tarea && modo !== 'rechazada' ? proposeCoverage(contexto, tarea.id, candidato) : null),
    [contexto, tarea, candidato, modo],
  )
  const elegibles = useMemo(() => (tarea ? getCoverageCandidates(contexto, tarea.id) : []), [contexto, tarea])
  const cargas = useMemo(() => calculateLoads(members, tasks), [members, tasks])

  const ausente = absence ? miembroPorId(members, absence.memberId) : undefined
  const propuesta = resultado?.proposal ?? null
  const riesgo: Riesgo = pendientes.length > 0 ? 'Medio' : 'Bajo'

  function reiniciar() {
    setModo('propuesta')
    setCandidato(undefined)
  }

  function registrar() {
    setCubierta(null)
    reiniciar()
    onSetAbsence(DEMO_ABSENCE)
  }

  function aceptar(p: CoverageProposal) {
    const quien = miembroPorId(members, p.candidateId)
    const nueva = p.projectedLoads.find((c) => c.memberId === p.candidateId)
    const t = tasks.find((x) => x.id === p.taskId)
    if (quien && nueva && t) {
      setCubierta({ tarea: t.title, quien: quien.name, carga: `${horas(nueva.assignedHours)} de ${horas(nueva.availableHours)} h` })
    }
    reiniciar()
    onAccept(p)
  }

  function rechazar() {
    rejectProposal()
    setModo('rechazada')
  }

  /** Motivo legible de por qué alguien no puede cubrir; sin culpa y sin datos privados. */
  function motivo(memberId: string) {
    if (!tarea) return ''
    if (contexto.absences.some((a) => a.status === 'active' && a.memberId === memberId)) return 'Ausente'
    const c = cargas.find((x) => x.memberId === memberId)
    if (!c || c.availableHours === 0) return 'Sin horas disponibles'
    const falta = tarea.estimatedHours - c.remainingHours
    return `${horas(c.remainingHours)} h libres · faltan ${horas(falta)} h`
  }

  /* ── Sin ausencia registrada ── */
  if (!absence || !ausente) {
    return (
      <>
        <header className="pagina">
          <h1>Nadie está ausente. <span className="fa">Si alguien no puede trabajar unos días, regístralo y TeamGuard propone quién cubre.</span></h1>
          <div className="pagina-pie">
            <Propiedades items={[{ icono: 'estado', etiqueta: 'Riesgo', valor: <ChipRiesgo riesgo="Bajo" /> }]} />
          </div>
        </header>
        {cubierta && <Confirmacion {...cubierta} />}
        <Callout icono="ausencia">
          <h2 className="callout-titulo">Registrar una ausencia</h2>
          <p className="callout-texto">Solo se guardan las fechas. El motivo queda privado y nadie del equipo lo ve.</p>
          <div className="acciones">
            <button className="btn btn-p" onClick={registrar}><Icono nombre="ausencia" />Registrar ausencia de Ana · {rango(DEMO_ABSENCE.from, DEMO_ABSENCE.to)}</button>
          </div>
        </Callout>
      </>
    )
  }

  /* ── Con ausencia ── */
  const nuevo = propuesta ? miembroPorId(members, propuesta.candidateId) : undefined
  const dueno = propuesta ? miembroPorId(members, propuesta.currentOwnerId) : undefined
  const tareasAusente = tasks.filter((t) => t.ownerId === ausente.id && t.status !== 'done')

  return (
    <>
      <header className="pagina">
        <h1>
          {ausente.name} estará ausente del {rango(absence.from, absence.to)}.{' '}
          <span className="fa">
            {pendientes.length > 0
              ? `${pendientes.length} ${plural(pendientes.length, 'tarea necesita', 'tareas necesitan')} cobertura.`
              : 'Todo su trabajo está cubierto.'}
          </span>
        </h1>
        <div className="pagina-pie">
          <Propiedades items={[
            { icono: 'estado', etiqueta: 'Riesgo', valor: <ChipRiesgo riesgo={riesgo} /> },
            { icono: 'persona', etiqueta: 'Ausente', valor: <span className="persona"><Avatar member={ausente} members={members} chico />{ausente.name}</span> },
            { icono: 'calendario', etiqueta: 'Fechas', valor: rango(absence.from, absence.to) },
            { icono: 'candado', etiqueta: 'Motivo', valor: <span className="fa">Privado</span> },
          ]} />
          <button className="btn btn-t" onClick={() => { reiniciar(); onSetAbsence(null) }}>Quitar ausencia</button>
        </div>
      </header>

      {cubierta && <Confirmacion {...cubierta} />}

      <section aria-labelledby="h-afectadas" className="bloque">
        <div className="bloque-cabeza"><h2 id="h-afectadas">Tareas afectadas</h2></div>
        <ul className="panel lista lista-simple">
          {pendientes.map((t) => (
            <li key={t.id} className="afectada">
              <span className="db-titulo">{t.title}</span>
              <span className="fa"><span className="num">{horas(t.estimatedHours)} h</span> · vence el {fecha(t.dueDate)}</span>
              <span className="chip c-wa"><Icono nombre="alerta" tam={12} />Sin cubrir</span>
            </li>
          ))}
          {pendientes.length === 0 && tareasAusente.length === 0 && (
            <li className="afectada"><span className="fa">{ausente.name} no tiene tareas abiertas en esas fechas.</span><span className="chip c-ok"><Icono nombre="check" tam={12} />Cubierto</span></li>
          )}
          {pendientes.length === 0 && tareasAusente.map((t) => (
            <li key={t.id} className="afectada">
              <span className="db-titulo">{t.title}</span>
              <span className="fa">vence el {fecha(t.dueDate)}, fuera de la ausencia</span>
              <span className="chip c-n">No requiere cobertura</span>
            </li>
          ))}
        </ul>
      </section>

      {tarea && modo === 'rechazada' && (
        <Callout icono="info" rol="status">
          <h2 className="callout-titulo">Propuesta rechazada</h2>
          <p className="callout-texto">Las tareas siguen igual. {tarea.title} continúa sin cubrir.</p>
          <div className="acciones">
            <button className="btn btn-p" onClick={reiniciar}>Pedir otra propuesta</button>
            <button className="btn btn-s" onClick={() => setModo('editar')}><Icono nombre="editar" />Elegir a otra persona</button>
          </div>
        </Callout>
      )}

      {tarea && modo !== 'rechazada' && resultado && !propuesta && (
        <Callout icono="info" tono="wa" rol="status">
          <h2 className="callout-titulo">Nadie puede cubrir {tarea.title} ahora</h2>
          <p className="callout-texto">{resultado.reason}</p>
          {candidato && <div className="acciones"><button className="btn btn-s" onClick={() => setCandidato(undefined)}>Volver a la propuesta</button></div>}
        </Callout>
      )}

      {tarea && propuesta && nuevo && dueno && (
        <section aria-labelledby="h-propuesta" className="bloque">
          <div className="bloque-cabeza"><h2 id="h-propuesta">Propuesta</h2><span className="fa">Decide una persona; TeamGuard solo propone.</span></div>
          <div className="panel decision">
            <p className="decision-frase">
              Pasar <b>{tarea.title}</b> <span className="fa num">({horas(tarea.estimatedHours)} h)</span> de{' '}
              <span className="persona"><Avatar member={dueno} members={members} chico />{dueno.name}</span> a{' '}
              <span className="persona"><Avatar member={nuevo} members={members} chico />{nuevo.name}</span>
            </p>

            {modo === 'editar' && (
              <fieldset className="opciones">
                <legend className="fa">¿Quién cubre {tarea.title}?</legend>
                {members.filter((m) => m.id !== tarea.ownerId).map((m) => {
                  const ok = elegibles.some((e) => e.id === m.id)
                  const c = cargas.find((x) => x.memberId === m.id)
                  return (
                    <label key={m.id} className={`opcion${ok ? '' : ' opcion-no'}`}>
                      <input type="radio" name="candidato" value={m.id} disabled={!ok} checked={propuesta.candidateId === m.id} onChange={() => setCandidato(m.id)} />
                      <Avatar member={m} members={members} chico />
                      <span className="opcion-nombre">{m.name}</span>
                      {ok && c
                        ? <span className="chip c-ok"><Icono nombre="check" tam={12} />Cabe · {horas(c.remainingHours)} h libres</span>
                        : <span className="chip c-n">{motivo(m.id)}</span>}
                    </label>
                  )
                })}
              </fieldset>
            )}

            <div className="decision-cargas">
              {[propuesta.candidateId, propuesta.currentOwnerId].map((id) => {
                const m = miembroPorId(members, id)
                const antes = propuesta.currentLoads.find((c) => c.memberId === id)
                const despues = propuesta.projectedLoads.find((c) => c.memberId === id)
                if (!m || !antes || !despues) return null
                return (
                  <CargaFila key={id} compacta member={m} members={members} load={despues} antes={antes}
                    detalle={id === propuesta.candidateId ? 'Recibe la tarea' : 'Queda libre durante la ausencia'} />
                )
              })}
            </div>

            <div className="decision-acciones">
              <button className="btn btn-p" onClick={() => aceptar(propuesta)}><Icono nombre="check" />{modo === 'editar' ? `Aceptar con ${nuevo.name}` : 'Aceptar'}</button>
              {modo === 'editar'
                ? <button className="btn btn-s" onClick={() => setModo('propuesta')}>Listo</button>
                : <button className="btn btn-s" onClick={() => setModo('editar')}><Icono nombre="editar" />Editar</button>}
              <span className="relleno-h" />
              <button className="btn btn-t" onClick={rechazar}>Rechazar</button>
            </div>
          </div>
        </section>
      )}
    </>
  )
}

function Confirmacion({ tarea, quien, carga }: { tarea: string; quien: string; carga: string }) {
  return (
    <Callout icono="check" tono="ok" rol="status">
      <h2 className="callout-titulo">{tarea} ahora es de {quien}.</h2>
      <p className="callout-texto">{quien} queda en {carga}. El cambio ya se ve en el Tablero y en la Entrega.</p>
    </Callout>
  )
}
