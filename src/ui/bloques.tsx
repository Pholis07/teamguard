import { Children, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { RUNE, type NombreRune } from './iconosRune'
import { useTextos, VERSIONES, type Version } from './version'
import { ACENTOS, PAGINAS, horas, pct, type Acento, type ColorEtiqueta } from './formato'

/* Íconos: Rune Icons en estilo contorno (iconosRune.ts); los que Rune no tiene siguen como trazos propios. Grosor 2 en toda la interfaz. */
const TRAZOS = {
  texto: <><path d="M4 7V4h16v3" /><path d="M9 20h6" /><path d="M12 4v16" /></>,
  numero: <><path d="M4 9h16" /><path d="M4 15h16" /><path d="M10 3 8 21" /><path d="M16 3l-2 18" /></>,
  simular: <><path d="M9 3h6" /><path d="M10 9V3" /><path d="M14 9V3" /><path d="M6.5 21h11a2 2 0 0 0 1.73-3L14 9h-4l-5.23 9A2 2 0 0 0 6.5 21Z" /></>,
  ausencia: <><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="m14 14-4 4" /><path d="m10 14 4 4" /></>,
  contingencia: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.5" /><path d="m5.6 5.6 3.9 3.9" /><path d="m14.5 14.5 3.9 3.9" /><path d="m18.4 5.6-3.9 3.9" /><path d="m9.5 14.5-3.9 3.9" /></>,
} as const

export type NombreIcono = keyof typeof TRAZOS | NombreRune

export function Icono({ nombre, tam = 16 }: { nombre: NombreIcono; tam?: number }) {
  return (
    <svg
      aria-hidden="true" width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icono"
      // Markup estático de Rune Icons (datos del repo, no entrada de usuario).
      {...(nombre in RUNE ? { dangerouslySetInnerHTML: { __html: RUNE[nombre as NombreRune] } } : { children: TRAZOS[nombre as keyof typeof TRAZOS] })}
    />
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
  const nombre: NombreIcono = icono in TRAZOS || icono in RUNE ? (icono as NombreIcono) : 'info'
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

/** Chevrón (Rune) que gira 90° y despliega el contenido (details nativo). */
export function Toggle({ titulo, abierto, children }: { titulo: ReactNode; abierto?: boolean; children: ReactNode }) {
  return (
    <details className="n-toggle" open={abierto}>
      <summary><span className="n-flecha" aria-hidden="true"><Icono nombre="desplegar" tam={14} /></span>{titulo}</summary>
      <div className="n-toggle-c">{children}</div>
    </details>
  )
}

/** Etiqueta: siempre lleva texto (grises; rojo/naranja/amarillo = alerta). */
/**
 * Cifra que cuenta de `desde` a `valor` (y de un valor al siguiente cuando cambia). Sin animación si el
 * sistema pide reducir movimiento; los lectores de pantalla oyen solo el valor final.
 */
export function Cifra({ valor, desde = valor }: { valor: number; desde?: number }) {
  const quieto = () => matchMedia('(prefers-reduced-motion: reduce)').matches
  const [mostrado, setMostrado] = useState(() => (quieto() ? valor : desde))
  const actual = useRef(mostrado)
  useEffect(() => {
    const inicio = actual.current
    const fijar = (n: number) => { actual.current = n; setMostrado(n) }
    if (inicio === valor || quieto()) return fijar(valor)
    const t0 = performance.now()
    let id = 0
    const paso = (t: number) => {
      const k = Math.min(1, (t - t0) / 700)
      fijar(Math.round(inicio + (valor - inicio) * (1 - (1 - k) ** 3)))
      if (k < 1) id = requestAnimationFrame(paso)
    }
    id = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(id)
  }, [valor])
  return <span className="num"><span aria-hidden="true">{mostrado}</span><span className="sr-only">{valor}</span></span>
}

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
export function BaseDeDatos({ titulo, subtitulo, apilada, columnas, onNueva, textoNueva = 'Nueva', vacio, children }: {
  titulo?: ReactNode
  /** Aclara qué mide la tabla («% de su tiempo disponible»). */
  subtitulo?: ReactNode
  /** En móvil cada fila pasa a ser una tarjeta en vez de desplazarse. */
  apilada?: boolean
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
      {subtitulo && <p className="n-bd-sub">{subtitulo}</p>}
      <div className={apilada ? 'n-bd-marco n-apilada' : 'n-bd-marco'}>
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
