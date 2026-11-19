import { Children, type ReactNode } from 'react'
import { horas, pct, type ColorEtiqueta } from './formato'

/* Íconos: trazos Lucide en línea, un solo grosor (1.7) en toda la interfaz. */
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
  numero: <><path d="M4 9h16" /><path d="M4 15h16" /><path d="M10 3 8 21" /><path d="M16 3l-2 18" /></>,
  estado: <><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></>,
  tabla: <><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /></>,
  flecha: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  escudo: <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />,
  simular: <><path d="M9 3h6" /><path d="M10 9V3" /><path d="M14 9V3" /><path d="M6.5 21h11a2 2 0 0 0 1.73-3L14 9h-4l-5.23 9A2 2 0 0 0 6.5 21Z" /></>,
  ausencia: <><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="m14 14-4 4" /><path d="m10 14 4 4" /></>,
  editar: <><path d="M12 20h9" /><path d="M16.38 3.62a1 1 0 0 1 3 3L7.37 18.64a2 2 0 0 1-.86.5l-2.87.84a.5.5 0 0 1-.62-.62l.84-2.87a2 2 0 0 1 .5-.86z" /></>,
  x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
  mas: <><path d="M5 12h14" /><path d="M12 5v14" /></>,
  menu: <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>,
  buscar: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
  chevron: <path d="m7 15 5 5 5-5M7 9l5-5 5 5" />,
  basura: <><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
  presentar: <path d="M6 3.5v17a1 1 0 0 0 1.5.86l14-8.5a1 1 0 0 0 0-1.72l-14-8.5A1 1 0 0 0 6 3.5Z" />,
  compartir: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></>,
} as const

export type NombreIcono = keyof typeof TRAZOS

export function Icono({ nombre, tam = 16 }: { nombre: NombreIcono; tam?: number }) {
  return (
    <svg aria-hidden="true" width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="icono">
      {TRAZOS[nombre]}
    </svg>
  )
}

/** Página de Notion: emoji de 72px, título, propiedades, divisor y bloques. Va dentro de la columna que pone Shell. */
export function Pagina({ icono, titulo, propiedades, children }: { icono: string; titulo: ReactNode; propiedades?: ReactNode; children?: ReactNode }) {
  return (
    <article className="n-doc">
      <header className="n-cab">
        <div className="n-icono" aria-hidden="true">{icono}</div>
        <h1 className="n-titulo">{titulo}</h1>
        {propiedades}
      </header>
      <hr className="n-div" />
      <div className="n-bloques">{children}</div>
    </article>
  )
}

/** Lista de propiedades: ícono de línea + etiqueta gris de 160px + valor. */
export function Propiedades({ items }: { items: { icono: NombreIcono; etiqueta: string; valor: ReactNode }[] }) {
  return (
    <dl className="n-props">
      {items.map((p) => (
        <div key={p.etiqueta} className="n-prop">
          <dt><Icono nombre={p.icono} />{p.etiqueta}</dt>
          <dd>{p.valor}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Bloque tenue con emoji (o ícono de línea) a la izquierda. `tono` pinta el fondo con una etiqueta de color. */
export function Callout({ icono, tono = 'n', rol, children }: { icono: string | NombreIcono; tono?: 'n' | ColorEtiqueta; rol?: 'status' | 'alert'; children: ReactNode }) {
  return (
    <div className={tono === 'n' ? 'n-callout' : `n-callout tono-${tono}`} role={rol}>
      <span className="n-callout-i">{icono in TRAZOS ? <Icono nombre={icono as NombreIcono} /> : icono}</span>
      <div className="n-callout-c">{children}</div>
    </div>
  )
}

/** Casillas de solo lectura (o con `onCambiar`, interactivas). `accion` agrega un botón fantasma al final de la fila. */
export function Checklist({ items, onCambiar }: {
  items: { texto: ReactNode; hecho: boolean; accion?: { texto: string; onClick: () => void } }[]
  onCambiar?: (indice: number) => void
}) {
  return (
    <ul className="n-check">
      {items.map((it, i) => {
        const marca = it.hecho && <Icono nombre="check" tam={12} />
        return (
          <li key={i}>
            {onCambiar ? (
              <button type="button" className="n-caja" data-hecho={it.hecho} role="checkbox" aria-checked={it.hecho} aria-label={typeof it.texto === 'string' ? it.texto : undefined} onClick={() => onCambiar(i)}>{marca}</button>
            ) : (
              <span className="n-caja" data-hecho={it.hecho} aria-hidden="true">{marca}</span>
            )}
            <span className="n-check-t" data-hecho={it.hecho}>
              {it.hecho && <span className="sr-only">Hecho: </span>}
              {it.texto}
            </span>
            {it.accion && <button type="button" className="btn btn-g" onClick={it.accion.onClick}>{it.accion.texto}</button>}
          </li>
        )
      })}
    </ul>
  )
}

/** Triángulo ▸ que gira 90° y despliega el contenido (details nativo). */
export function Toggle({ titulo, abierto, children }: { titulo: ReactNode; abierto?: boolean; children: ReactNode }) {
  return (
    <details className="n-toggle" open={abierto}>
      <summary><span className="n-flecha" aria-hidden="true">▶</span>{titulo}</summary>
      <div className="n-toggle-c">{children}</div>
    </details>
  )
}

/** Etiqueta de Notion: siempre lleva texto. */
export function Etiqueta({ color, children }: { color: ColorEtiqueta; children: ReactNode }) {
  return <span className={`tag tag-${color}`}>{children}</span>
}

/* La barra mide hasta 150 % de la capacidad; la marca está en el 100 %. */
const ESCALA = 1.5

/** Barra de carga: relleno azul hasta el 100 %, excedente rayado en rojo y texto «5 / 4 h · 125 %» + «1 h de más». */
export function BarraCarga({ asignadas, disponibles, soloBarra }: { asignadas: number; disponibles: number; soloBarra?: boolean }) {
  const sinCapacidad = disponibles <= 0
  const dentro = sinCapacidad ? 0 : (Math.min(asignadas, disponibles) / (disponibles * ESCALA)) * 100
  const total = sinCapacidad ? 0 : Math.min(asignadas / (disponibles * ESCALA), 1) * 100
  const extra = asignadas - disponibles
  const sobre = !sinCapacidad && extra > 0
  const texto = sinCapacidad
    ? `${horas(asignadas)} / 0 h · sin horas`
    : `${horas(asignadas)} / ${horas(disponibles)} h · ${pct((asignadas / disponibles) * 100)}`
  return (
    <div className="n-barra">
      <div className="n-barra-pista" role="presentation">
        <span className="n-barra-fill" style={{ width: `${dentro}%` }} />
        {sobre && <span className="n-barra-extra" style={{ left: `${dentro}%`, width: `${total - dentro}%` }} />}
        <span className="n-barra-marca" style={{ left: `${100 / ESCALA}%` }} />
      </div>
      {soloBarra ? <span className="sr-only">{texto}</span> : (
        <span className="n-barra-txt">
          {texto}
          {sobre && <Etiqueta color="rojo">{horas(extra)} h de más</Etiqueta>}
          {sinCapacidad && asignadas > 0 && <Etiqueta color="rojo">Sin capacidad</Etiqueta>}
        </span>
      )}
    </div>
  )
}

/** Tabla tipo Notion. `children` son filas `<tr>` (usa `.cel` en inputs para edición en línea). Con `onNueva` agrega «+ Nueva». */
export function BaseDeDatos({ titulo, columnas, onNueva, textoNueva = 'Nueva', vacio, children }: {
  titulo?: ReactNode
  columnas: { icono: NombreIcono; nombre: string; ancho?: string }[]
  onNueva?: () => void
  textoNueva?: string
  /** Texto cuando no hay filas (pasa `vacio` y children vacío). */
  vacio?: ReactNode
  children?: ReactNode
}) {
  return (
    <section className="n-bd">
      {titulo && <h2 className="n-bd-tit">{titulo}</h2>}
      <div className="n-bd-cab"><span className="n-bd-vista"><Icono nombre="tabla" tam={14} />Tabla</span></div>
      <div className="n-bd-marco">
        <table className="n-tabla">
          <thead>
            <tr>{columnas.map((c) => <th key={c.nombre} style={c.ancho ? { width: c.ancho } : undefined}><Icono nombre={c.icono} tam={14} />{c.nombre}</th>)}</tr>
          </thead>
          <tbody>
            {children}
            {vacio && Children.toArray(children).length === 0 && <tr className="n-vacia"><td colSpan={columnas.length}>{vacio}</td></tr>}
            {onNueva && (
              <tr className="n-fila-nueva">
                <td colSpan={columnas.length}><button type="button" className="n-nueva" onClick={onNueva}><Icono nombre="mas" tam={14} />{textoNueva}</button></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
