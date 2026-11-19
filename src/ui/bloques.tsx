import { Children, useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { useTextos, VERSIONES, type Version } from './version'
import { ACENTOS, PAGINAS, horas, pct, type Acento, type ColorEtiqueta } from './formato'

/* Íconos: trazos Lucide en línea, un solo grosor (1.5) en toda la interfaz. */
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
  tablero: <><rect width="7" height="18" x="3" y="3" rx="1.5" /><rect width="7" height="10" x="14" y="3" rx="1.5" /><rect width="7" height="5" x="14" y="16" rx="1.5" /></>,
  integrantes: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" /><path d="M18 14.2a6.5 6.5 0 0 1 3.5 5.8" /></>,
  tareas: <><rect width="18" height="18" x="3" y="3" rx="2" /><path d="m8 12 3 3 5-6" /></>,
  contingencia: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.5" /><path d="m5.6 5.6 3.9 3.9" /><path d="m14.5 14.5 3.9 3.9" /><path d="m18.4 5.6-3.9 3.9" /><path d="m9.5 14.5-3.9 3.9" /></>,
  entrega: <><path d="m7.5 4.3 9 5.2" /><path d="M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></>,
  inicio: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></>,
  luna: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
  sol: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.9 4.9 1.4 1.4" /><path d="m17.7 17.7 1.4 1.4" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.3 17.7-1.4 1.4" /><path d="m19.1 4.9-1.4 1.4" /></>,
  compartir: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></>,
} as const

export type NombreIcono = keyof typeof TRAZOS

export function Icono({ nombre, tam = 16 }: { nombre: NombreIcono; tam?: number }) {
  return (
    <svg aria-hidden="true" width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="icono">
      {TRAZOS[nombre]}
    </svg>
  )
}

/** Selector del color de acento: muestras circulares (radiogroup) con flechas para moverse y check en la elegida. */
export function SelectorAcento({ acento, onAcento }: { acento: Acento; onAcento: (a: Acento) => void }) {
  const grupo = useRef<HTMLDivElement>(null)
  const alTeclear = (e: KeyboardEvent) => {
    const paso = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!paso) return
    e.preventDefault()
    const i = ACENTOS.findIndex((a) => a.id === acento)
    const sig = ACENTOS[(i + paso + ACENTOS.length) % ACENTOS.length]
    onAcento(sig.id)
    grupo.current?.querySelector<HTMLElement>(`[data-id="${sig.id}"]`)?.focus()
  }
  return (
    <div className="sa" role="radiogroup" aria-label="Color de acento" ref={grupo} onKeyDown={alTeclear}>
      {ACENTOS.map((a) => (
        <button
          key={a.id} type="button" role="radio" className="sa-m" data-id={a.id} aria-checked={a.id === acento} aria-label={a.label} title={a.label}
          tabIndex={a.id === acento ? 0 : -1} style={{ '--m': a.swatch, '--mc': a.claro } as CSSProperties} onClick={() => onAcento(a.id)}
        >
          <Icono nombre="check" tam={12} />
        </button>
      ))}
    </div>
  )
}

/** Control segmentado «Estudiantes | Empresas» (radiogrupo con flechas). */
export function SelectorVersion({ version, onVersion, className = '' }: { version: Version; onVersion: (v: Version) => void; className?: string }) {
  const grupo = useRef<HTMLDivElement>(null)
  const alTeclear = (e: KeyboardEvent) => {
    const paso = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!paso) return
    e.preventDefault()
    const i = VERSIONES.findIndex((v) => v.id === version)
    const sig = VERSIONES[(i + paso + VERSIONES.length) % VERSIONES.length]
    onVersion(sig.id)
    grupo.current?.querySelector<HTMLElement>(`[data-id="${sig.id}"]`)?.focus()
  }
  return (
    <div className={`sv ${className}`} role="radiogroup" aria-label="Versión" ref={grupo} onKeyDown={alTeclear}>
      {VERSIONES.map((v) => (
        <button key={v.id} type="button" role="radio" className="sv-o" data-id={v.id} aria-checked={v.id === version} tabIndex={v.id === version ? 0 : -1} onClick={() => onVersion(v.id)}>
          {v.label}
        </button>
      ))}
    </div>
  )
}

/** Página: etiqueta superior «PROYECTO · SECCIÓN», ícono de línea junto al título, propiedades como fichas, divisor y bloques.
 *  `icono` es un nombre de ícono; `seccion` (opcional) sale de PAGINAS cuando el ícono es el de una página. */
export function Pagina({ icono, seccion, titulo, propiedades, children }: { icono: NombreIcono; seccion?: string; titulo: ReactNode; propiedades?: ReactNode; children?: ReactNode }) {
  const t = useTextos()
  const pag = PAGINAS.find((p) => p.icono === icono)
  const etiqueta = seccion ?? (pag?.id === 'integrantes' ? t.pagina.integrantes : pag?.label)
  return (
    <article className="n-doc">
      <header className="n-cab">
        {etiqueta && <p className="n-eyebrow">Proyecto · {etiqueta}</p>}
        <h1 className="n-titulo"><span className="n-titulo-i" aria-hidden="true"><Icono nombre={icono} tam={28} /></span><span>{titulo}</span></h1>
        {propiedades}
      </header>
      <hr className="n-div" />
      <div className="n-bloques">{children}</div>
    </article>
  )
}

/** Fichas con borde en una fila que se ajusta: ícono + etiqueta gris + valor. */
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

/** Bloque con borde izquierdo de 2px y sin fondo. `tono`: neutro, blanco (info/verde/azul) o alerta (amarillo/naranja/rojo). `icono` es un nombre de ícono; si no existe, se usa «info». */
export function Callout({ icono, tono = 'n', rol, children }: { icono: string; tono?: 'n' | ColorEtiqueta; rol?: 'status' | 'alert'; children: ReactNode }) {
  const nombre: NombreIcono = icono in TRAZOS ? (icono as NombreIcono) : 'info'
  return (
    <div className={tono === 'n' ? 'n-callout' : `n-callout tono-${tono}`} role={rol}>
      <span className="n-callout-i"><Icono nombre={nombre} /></span>
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

/** Etiqueta: siempre lleva texto (grises; rojo/naranja/amarillo = alerta). */
export function Etiqueta({ color, children }: { color: ColorEtiqueta; children: ReactNode }) {
  return <span className={`tag tag-${color}`}>{children}</span>
}

/* La barra mide hasta 150 % de la capacidad; la marca está en el 100 %. */
const ESCALA = 1.5

/** Barra de carga: relleno claro hasta el 100 %, excedente rayado en color de alerta y texto «5 / 4 h · 125 %» + «1 h de más». */
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

/** Tabla. `children` son filas `<tr>` (usa `.cel` en inputs para edición en línea). Con `onNueva` agrega «+ Nueva». */
export function BaseDeDatos({ titulo, columnas, onNueva, textoNueva = 'Nueva', vacio, children }: {
  titulo?: ReactNode
  columnas: { icono?: NombreIcono; nombre: string; ancho?: string }[]
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
            <tr>{columnas.map((c) => <th key={c.nombre} style={c.ancho ? { width: c.ancho } : undefined}>{c.nombre}</th>)}</tr>
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
