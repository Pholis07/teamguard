import type { Aporte } from './aporte'
import { horas, plural } from './formato'
import './grafica.css'

/** Barras apiladas por persona (hecho · en progreso · pendiente); el % es de las horas del equipo. */
export function GraficaAporte({ datos, compacta }: { datos: Aporte; compacta?: boolean }) {
  if (datos.total <= 0) return null
  const max = Math.max(...datos.miembros.map((m) => m.horas))
  const resumen = datos.miembros
    .map((m) => `${m.name}: ${horas(m.horas)} h, ${m.pct} % del total (${horas(m.hecho)} hechas, ${horas(m.enProgreso)} en progreso, ${horas(m.pendiente)} pendientes; ${m.tareas} ${plural(m.tareas, 'tarea', 'tareas')}, ${m.archivos} ${plural(m.archivos, 'archivo', 'archivos')})`)
    .join('. ')
  const trozo = (h: number) => `${(h * 100) / max}%`

  return (
    <div className={`g-ap${compacta ? ' g-ap-c' : ''}`} role="img" aria-label={`Aporte del equipo, ${horas(datos.total)} h en total. ${resumen}.`}>
      <ul className="g-ap-filas" aria-hidden="true">
        {datos.miembros.map((m) => (
          <li key={m.memberId} className="g-ap-fila">
            <span className="g-ap-nombre">{m.name}</span>
            <span className="g-ap-pista">
              <span className="g-ap-barra" style={{ width: trozo(m.horas) }}>
                {m.hecho > 0 && <span className="g-ap-hecho" style={{ flexGrow: m.hecho }} />}
                {m.enProgreso > 0 && <span className="g-ap-prog" style={{ flexGrow: m.enProgreso }} />}
                {m.pendiente > 0 && <span className="g-ap-pend" style={{ flexGrow: m.pendiente }} />}
              </span>
            </span>
            <span className="g-ap-cifra num">{horas(m.horas)} h · {m.pct} %</span>
            {!compacta && <span className="g-ap-sub">{m.tareas} {plural(m.tareas, 'tarea', 'tareas')} · {m.archivos} {plural(m.archivos, 'archivo', 'archivos')}</span>}
          </li>
        ))}
      </ul>
      <p className="g-ap-leyenda" aria-hidden="true">
        <span><i className="g-ap-sw g-ap-hecho" />Hecho</span>
        <span><i className="g-ap-sw g-ap-prog" />En progreso</span>
        <span><i className="g-ap-sw g-ap-pend" />Pendiente</span>
      </p>
    </div>
  )
}
