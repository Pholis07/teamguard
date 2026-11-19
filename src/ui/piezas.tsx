import type { ReactNode } from 'react'
import type { Member, MemberLoad, Task } from '../domain'
import { horas, pct, plural } from './formato'
import './vistas.css'

/* Iconos: trazos Lucide, un solo grosor en toda la interfaz. */
const TRAZOS = {
  check: <path d="M20 6 9 17l-5-5" />,
  alerta: <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
  info: <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></>,
  candado: <><rect width="18" height="11" x="3" y="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  calendario: <><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></>,
  persona: <><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 0 0-16 0" /></>,
  personas: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  reloj: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  texto: <><path d="M4 7V4h16v3" /><path d="M9 20h6" /><path d="M12 4v16" /></>,
  estado: <><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></>,
  tabla: <><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /></>,
  flecha: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  escudo: <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />,
  simular: <><path d="M9 3h6" /><path d="M10 9V3" /><path d="M14 9V3" /><path d="M6.5 21h11a2 2 0 0 0 1.73-3L14 9h-4l-5.23 9A2 2 0 0 0 6.5 21Z" /></>,
  ausencia: <><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="m14 14-4 4" /><path d="m10 14 4 4" /></>,
  editar: <><path d="M12 20h9" /><path d="M16.38 3.62a1 1 0 0 1 3 3L7.37 18.64a2 2 0 0 1-.86.5l-2.87.84a.5.5 0 0 1-.62-.62l.84-2.87a2 2 0 0 1 .5-.86z" /></>,
  x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
} as const

export type NombreIcono = keyof typeof TRAZOS

export function Icono({ nombre, tam = 15 }: { nombre: NombreIcono; tam?: number }) {
  return (
    <svg aria-hidden="true" width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="icono">
      {TRAZOS[nombre]}
    </svg>
  )
}

export function Avatar({ member, members, chico }: { member: Member; members: readonly Member[]; chico?: boolean }) {
  const i = (members.findIndex((m) => m.id === member.id) % 3) + 1
  return <span className={`av av${i}${chico ? ' av-s' : ''}`} aria-hidden="true">{member.name[0]}</span>
}

/* Estado de una tarea: siempre texto + icono, nunca solo color. */
const ESTADO_TAREA: Record<Task['status'], { texto: string; icono: ReactNode }> = {
  pending: { texto: 'Pendiente', icono: <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3"><circle cx="12" cy="12" r="9" /></svg> },
  active: { texto: 'En progreso', icono: <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" /></svg> },
  done: { texto: 'Completada', icono: <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></svg> },
}

export function EstadoTarea({ status }: { status: Task['status'] }) {
  const e = ESTADO_TAREA[status]
  return <span className={`chip ${status === 'done' ? 'c-ok' : 'c-n'}`}>{e.icono}{e.texto}</span>
}

export type Riesgo = 'Bajo' | 'Medio' | 'Alto'
export function ChipRiesgo({ riesgo }: { riesgo: Riesgo }) {
  return (
    <span className={`chip ${riesgo === 'Bajo' ? 'c-ok' : 'c-wa'}`}>
      <Icono nombre={riesgo === 'Bajo' ? 'check' : 'alerta'} tam={12} />
      Riesgo {riesgo.toLowerCase()}
    </span>
  )
}

/* Propiedades de página, como en Notion: icono + etiqueta gris + valor. */
export function Propiedades({ items }: { items: { icono: NombreIcono; etiqueta: string; valor: ReactNode }[] }) {
  return (
    <dl className="props">
      {items.map((p) => (
        <div key={p.etiqueta} className="prop">
          <dt><Icono nombre={p.icono} tam={14} />{p.etiqueta}</dt>
          <dd>{p.valor}</dd>
        </div>
      ))}
    </dl>
  )
}

/* Callout de Notion: bloque tenue con icono; el tono cambia el fondo, nunca un borde grueso. */
export function Callout({ icono, tono = 'n', children, rol }: { icono: NombreIcono; tono?: 'n' | 'wa' | 'ok'; children: ReactNode; rol?: 'status' | 'alert' }) {
  return (
    <div className={`callout callout-${tono}`} role={rol}>
      <span className="callout-icono"><Icono nombre={icono} tam={16} /></span>
      <div className="callout-cuerpo">{children}</div>
    </div>
  )
}

/* La barra mide hasta 150 % de la disponibilidad; la marca está en el 100 %. */
const ESCALA = 1.5
const MARCA = `${100 / ESCALA}%`

function Barra({ load }: { load: MemberLoad }) {
  const cap = load.availableHours
  if (cap <= 0) return <div className="track" />
  const total = Math.min(load.assignedHours / (cap * ESCALA), 1) * 100
  const dentro = Math.min(load.assignedHours, cap) / (cap * ESCALA) * 100
  const sobre = load.status === 'overloaded'
  return (
    <div className="track" role="presentation">
      <span className="fill" style={{ width: `${dentro}%` }} />
      {sobre && <span className="hatch" style={{ left: `${dentro}%`, width: `${total - dentro}%` }} />}
      <span className="tick" style={{ left: MARCA }} />
    </div>
  )
}

export function ChipHoras({ load }: { load: MemberLoad }) {
  if (load.status === 'no-capacity') return <span className="chip c-n">Sin horas</span>
  if (load.status === 'overloaded') {
    const extra = load.assignedHours - load.availableHours
    return <span className="chip c-wa"><Icono nombre="alerta" tam={12} />{horas(extra)} h de más</span>
  }
  if (load.remainingHours === 0) return <span className="chip c-n">Sin horas libres</span>
  return <span className="chip c-o">{horas(load.remainingHours)} {plural(load.remainingHours, 'h libre', 'h libres')}</span>
}

/** Fila de carga. Con `antes`, muestra la cifra previa tachada para leer el cambio. */
export function CargaFila({ member, members, load, antes, detalle, compacta }: {
  member: Member
  members: readonly Member[]
  load: MemberLoad
  antes?: MemberLoad
  detalle?: ReactNode
  compacta?: boolean
}) {
  const cambio = antes && antes.assignedHours !== load.assignedHours
  return (
    <div className={`carga${compacta ? ' carga-compacta' : ''}`}>
      <span className="carga-quien">
        <Avatar member={member} members={members} />
        <span><span className="carga-nombre">{member.name}</span>{detalle && <span className="fa carga-detalle">{detalle}</span>}</span>
      </span>
      <span className="num carga-cifra">
        {cambio && <><s className="fa">{horas(antes.assignedHours)}</s><Icono nombre="flecha" tam={12} /></>}
        {horas(load.assignedHours)}<span className="fa"> / {horas(load.availableHours)} h</span>
      </span>
      <span className="carga-barra">
        <Barra load={load} />
        <span className="sr-only">{pct(load.percentage)} de su disponibilidad</span>
      </span>
      <span className="carga-chip"><ChipHoras load={load} /></span>
    </div>
  )
}

