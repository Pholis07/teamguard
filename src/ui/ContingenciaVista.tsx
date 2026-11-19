import { useMemo, useState } from 'react'
import {
  DEMO_DATE, calculateLoads, getCoverageCandidates, getTasksNeedingCoverage, proposeCoverage, rejectProposal,
  type Absence, type CoverageProposal, type Member, type RuleContext,
} from '../domain'
import { BarraCarga, Callout, Cifra, Etiqueta, Icono, Pagina, Propiedades } from './bloques'
import { equilibrio } from './equilibrio'
import { COLOR_RIESGO, fecha, fechaValida, horas, miembroPorId, rango } from './formato'
import './paginas.css'

type Props = {
  contexto: RuleContext
  absence: Absence | null
  onSetAbsence: (absence: Absence | null) => void
  /** Lo único que reasigna: la integración confirma la propuesta contra el estado actual. */
  onAccept: (proposal: CoverageProposal) => void
}

type Modo = 'propuesta' | 'editar' | 'rechazada'

function Avatar({ member, members }: { member: Member; members: readonly Member[] }) {
  const i = (members.findIndex((m) => m.id === member.id) % 3) + 1
  return <span className={`av av${i} av-s`} aria-hidden="true">{member.name[0]}</span>
}

const sumarDias = (iso: string, dias: number) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

export function ContingenciaVista({ contexto, absence, onSetAbsence, onAccept }: Props) {
  const { members, tasks } = contexto
  const [modo, setModo] = useState<Modo>('propuesta')
  const [candidato, setCandidato] = useState<string | undefined>(undefined)
  const [rechazados, setRechazados] = useState<string[]>([])
  const [aviso, setAviso] = useState('')
  const [cubierta, setCubierta] = useState<{ tarea: string; quien: string; carga: string; antes: number; despues: number } | null>(null)
  const [quien, setQuien] = useState('')
  const [desde, setDesde] = useState(DEMO_DATE)
  const [hasta, setHasta] = useState(sumarDias(DEMO_DATE, 2))
  const [error, setError] = useState('')

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

  function reiniciar() {
    setModo('propuesta')
    setCandidato(undefined)
    setRechazados([])
    setAviso('')
  }

  function registrar(e: React.FormEvent) {
    e.preventDefault()
    const memberId = quien || members[0]?.id
    if (!memberId) return setError('Primero agrega integrantes en Integrantes.')
    if (!fechaValida(desde) || !fechaValida(hasta)) return setError('Elige fechas válidas.')
    if (hasta < desde) return setError('«Hasta» no puede ser antes que «Desde».')
    setError('')
    setCubierta(null)
    reiniciar()
    onSetAbsence({ memberId, from: desde, to: hasta, status: 'active' })
  }

  function aceptar(p: CoverageProposal) {
    const persona = miembroPorId(members, p.candidateId)
    const nueva = p.projectedLoads.find((c) => c.memberId === p.candidateId)
    const t = tasks.find((x) => x.id === p.taskId)
    if (persona && nueva && t) {
      const antes = equilibrio(contexto).indice
      const despues = equilibrio({ ...contexto, tasks: tasks.map((x) => (x.id === p.taskId ? { ...x, ownerId: p.candidateId } : x)) }).indice
      setCubierta({ tarea: t.title, quien: persona.name, carga: `${horas(nueva.assignedHours)} de ${horas(nueva.availableHours)} h`, antes, despues })
    }
    reiniciar()
    onAccept(p)
  }

  function rechazar(p: CoverageProposal) {
    rejectProposal()
    setRechazados((r) => [...r, p.candidateId])
    setModo('rechazada')
  }

  function pedirOtra() {
    const otra = elegibles.find((m) => !rechazados.includes(m.id))
    setModo('propuesta')
    if (otra) {
      setCandidato(otra.id)
      setAviso('')
    } else {
      setCandidato(undefined)
      setAviso('No hay otra persona con espacio; esta sigue siendo la mejor opción.')
    }
  }

  /** Motivo legible de por qué alguien no puede cubrir; sin culpa y sin datos privados. */
  function motivo(memberId: string) {
    if (!tarea) return ''
    if (contexto.absences.some((a) => a.status === 'active' && a.memberId === memberId)) return 'Ausente'
    const c = cargas.find((x) => x.memberId === memberId)
    if (!c || c.availableHours === 0) return 'Sin horas disponibles'
    return `${horas(c.remainingHours)} h libres · faltan ${horas(tarea.estimatedHours - c.remainingHours)} h`
  }

  const confirmacion = cubierta && (
    <Callout icono="check" tono="verde" rol="status">
      <p className="p-parr">{cubierta.tarea} ahora es de {cubierta.quien}. {cubierta.quien} queda en {cubierta.carga}.</p>
      <p className="p-confirma num">Equilibrio {cubierta.antes} → <b><Cifra desde={cubierta.antes} valor={cubierta.despues} /></b>/100</p>
    </Callout>
  )

  /* Sin ausencia registrada */
  if (!absence || !ausente) {
    const sinGente = members.length === 0
    return (
      <Pagina icono="contingencia" titulo="Contingencia">
        <p className="p-estado">Nadie está ausente.<span className="fa">Si alguien no puede trabajar unos días, regístralo y TeamGuard propone quién cubre.</span></p>
        {confirmacion}
        {sinGente && <Callout icono="info" tono="amarillo" rol="status"><p className="p-parr">Todavía no hay integrantes. Agrégalos en Integrantes para registrar una ausencia.</p></Callout>}
        <Callout icono="ausencia">
          <form className="p-campos" onSubmit={registrar} noValidate>
            <label className="p-campo">Integrante
              <select className="p-select" value={quien || members[0]?.id || ''} onChange={(e) => setQuien(e.target.value)} disabled={sinGente}>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </label>
            <label className="p-campo">Desde
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </label>
            <label className="p-campo">Hasta
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </label>
            <button type="submit" className="btn btn-p" disabled={sinGente}><Icono nombre="ausencia" />Registrar ausencia</button>
          </form>
          {error && <p className="p-error" role="alert">{error}</p>}
          <p className="p-nota">El motivo es privado; solo se guardan las fechas.</p>
        </Callout>
      </Pagina>
    )
  }

  /* Con ausencia */
  const nuevo = propuesta ? miembroPorId(members, propuesta.candidateId) : undefined
  const dueno = propuesta ? miembroPorId(members, propuesta.currentOwnerId) : undefined
  const riesgo = equilibrio(contexto).riesgo

  return (
    <Pagina
      icono="contingencia"
      titulo="Contingencia"
      propiedades={
        <Propiedades items={[
          { icono: 'estado', etiqueta: 'Riesgo', valor: <Etiqueta color={COLOR_RIESGO[riesgo]}>{riesgo}</Etiqueta> },
          { icono: 'persona', etiqueta: 'Ausente', valor: <><span className="p-persona"><Avatar member={ausente} members={members} />{ausente.name}</span><Etiqueta color="cafe">Ausente</Etiqueta></> },
          { icono: 'calendario', etiqueta: 'Fechas', valor: <span className="num">{rango(absence.from, absence.to)}</span> },
          { icono: 'candado', etiqueta: 'Motivo', valor: <span className="fa">Privado</span> },
        ]} />
      }
    >
      <div className="p-acciones">
        <button type="button" className="btn btn-g p-suelto" onClick={() => { reiniciar(); onSetAbsence(null) }}>Quitar ausencia</button>
      </div>

      {confirmacion}

      <section className="n-bd">
        <h2 className="p-sub">Tareas afectadas</h2>
        <ul className="p-lista">
          {pendientes.map((t) => (
            <li key={t.id} className="p-afectada">
              <span className="p-lista-tit">{t.title}</span>
              <span className="fa"><span className="num">{horas(t.estimatedHours)} h</span> · vence el {fecha(t.dueDate)}</span>
              <Etiqueta color="naranja">Sin cubrir</Etiqueta>
            </li>
          ))}
          {pendientes.length === 0 && <li className="p-afectada"><span className="fa">{ausente.name} no tiene tareas por cubrir en esas fechas.</span></li>}
        </ul>
      </section>

      {tarea && modo === 'rechazada' && (
        <Callout icono="info" rol="status">
          <p className="p-parr">Propuesta rechazada. Las tareas siguen igual.</p>
          <div className="p-acciones">
            <button type="button" className="btn btn-p" onClick={pedirOtra}>Pedir otra propuesta</button>
            <button type="button" className="btn btn-s" onClick={() => { setCandidato(undefined); setModo('editar') }}><Icono nombre="editar" />Elegir a otra persona</button>
          </div>
        </Callout>
      )}

      {tarea && modo !== 'rechazada' && resultado && !propuesta && (
        <Callout icono="alerta" tono="amarillo" rol="status">
          <p className="p-parr">{resultado.reason}</p>
          {candidato && <div className="p-acciones"><button type="button" className="btn btn-s" onClick={() => setCandidato(undefined)}>Volver a la propuesta</button></div>}
        </Callout>
      )}

      {tarea && propuesta && nuevo && dueno && (
        <section className="p-prop" aria-label="Propuesta de cobertura">
          <p className="p-grande">
            Pasar <b>{tarea.title}</b> de {dueno.name} a {nuevo.name}
            {' '}<span className="fa num">({horas(tarea.estimatedHours)} h)</span>
          </p>
          <p className="p-nota num">
            Equilibrio {equilibrio(contexto).indice} → <b>{equilibrio({ ...contexto, tasks: tasks.map((t) => (t.id === propuesta.taskId ? { ...t, ownerId: propuesta.candidateId } : t)) }).indice}</b> si aceptas
          </p>
          {aviso && <p className="p-nota" role="status">{aviso}</p>}

          <div className="p-pers">
            {[propuesta.candidateId, propuesta.currentOwnerId].map((id) => {
              const m = miembroPorId(members, id)
              const antes = propuesta.currentLoads.find((c) => c.memberId === id)
              const despues = propuesta.projectedLoads.find((c) => c.memberId === id)
              if (!m || !antes || !despues) return null
              return (
                <div key={id} className="p-pers-fila">
                  <span className="p-persona"><Avatar member={m} members={members} />{m.name}</span>
                  <div className="p-carga">
                    <span className="p-antes">{horas(antes.assignedHours)}/{horas(antes.availableHours)} →</span>
                    <BarraCarga asignadas={despues.assignedHours} disponibles={despues.availableHours} />
                  </div>
                </div>
              )
            })}
          </div>

          {modo === 'editar' && (
            <fieldset className="p-radios">
              <legend>¿Quién cubre {tarea.title}?</legend>
              {members.filter((m) => m.id !== tarea.ownerId).map((m) => {
                const ok = elegibles.some((e) => e.id === m.id)
                const c = cargas.find((x) => x.memberId === m.id)
                return (
                  <label key={m.id} className="p-radio" data-no={!ok}>
                    <input type="radio" name="candidato" value={m.id} disabled={!ok} checked={propuesta.candidateId === m.id} onChange={() => setCandidato(m.id)} />
                    <Avatar member={m} members={members} />
                    {m.name}
                    {ok && c
                      ? <Etiqueta color="verde">Cabe · {horas(c.remainingHours)} h libres</Etiqueta>
                      : <Etiqueta color="gris">{motivo(m.id)}</Etiqueta>}
                  </label>
                )
              })}
            </fieldset>
          )}

          <div className="p-acciones">
            <button type="button" className="btn btn-p" onClick={() => aceptar(propuesta)}>Aceptar</button>
            <button type="button" className="btn btn-s" onClick={() => setModo(modo === 'editar' ? 'propuesta' : 'editar')}>{modo === 'editar' ? 'Listo' : 'Editar'}</button>
            <button type="button" className="btn btn-g" onClick={() => rechazar(propuesta)}>Rechazar</button>
          </div>
        </section>
      )}

    </Pagina>
  )
}
