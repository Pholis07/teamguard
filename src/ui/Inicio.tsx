import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import type { Acento, Tema } from './formato'
import { Icono, SelectorAcento, SelectorVersion } from './bloques'
import { irAVersion, useTextos, type Version } from './version'
import './inicio.css'

type Props = { tema: Tema; acento: Acento; onAcento: (a: Acento) => void; version: Version; onTema: () => void; onEmpezar: () => void; onEjemplo: () => void }

const FUNDIDO_MS = 300

/** true mientras la pestaña está visible: los bucles se detienen al ocultarla. */
function useActivo() {
  const [activo, setActivo] = useState(() => typeof document === 'undefined' || !document.hidden)
  useEffect(() => {
    const f = () => setActivo(!document.hidden)
    document.addEventListener('visibilitychange', f)
    return () => document.removeEventListener('visibilitychange', f)
  }, [])
  return activo
}

/** true si la persona pidió menos movimiento: se muestra el estado final, sin bucles. */
function useQuieto() {
  const q = typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
  const [quieto, setQuieto] = useState(!!q?.matches)
  useEffect(() => {
    if (!q) return
    const f = () => setQuieto(q.matches)
    q.addEventListener('change', f)
    return () => q.removeEventListener('change', f)
  }, [q])
  return quieto
}

/** Número que cuenta hasta `meta` con requestAnimationFrame (sin movimiento: salta). */
function useContador(meta: number, ms = 1100) {
  const quieto = useQuieto()
  const [v, setV] = useState(meta)
  const actual = useRef(meta)
  useEffect(() => {
    if (quieto) { actual.current = meta; return }
    const desde = actual.current
    if (desde === meta) return
    const t0 = performance.now()
    let id = 0
    const paso = (t: number) => {
      const p = Math.min(1, (t - t0) / ms)
      const e = 1 - Math.pow(1 - p, 3)
      actual.current = desde + (meta - desde) * e
      setV(Math.round(actual.current))
      if (p < 1) id = requestAnimationFrame(paso)
    }
    id = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(id)
  }, [meta, ms, quieto])
  return quieto ? meta : v
}
function Cuenta({ a, ms }: { a: number; ms?: number }) { return <>{useContador(a, ms)}</> }

/** Revela su contenido cada vez que entra en pantalla y lo oculta al salir, para que vuelva a animarse. */
function Revela({ children, className = '', retraso = 0, id }: { children: ReactNode; className?: string; retraso?: number; id?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  // Sin IntersectionObserver se muestra sin esperar.
  const [visto, setVisto] = useState(() => typeof IntersectionObserver === 'undefined')
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const obs = new IntersectionObserver((es) => {
      const e = es[es.length - 1]
      if (e) setVisto(e.isIntersecting)
    }, { threshold: 0.12 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return <div ref={ref} id={id} className={`in-rev ${visto ? 'in-vis' : ''} ${className}`} style={{ transitionDelay: visto ? `${retraso}ms` : '0ms' }}>{children}</div>
}

/* ---------- Vista previa del héroe: ciclo de ~12 s ---------- */
// 0 todo cabe · 1 Ana se ausenta · 2 propuesta aceptada · 3 reacomodo · 4 pausa y reinicio
const DUR = [2200, 2800, 2200, 3000, 1800]
const FINAL = 3
const EQ = [100, 57, 57, 100, 100]
const ANA = { w: [0.75, 0, 0, 0, 0], h: ['3/4 h', 'Ausente', 'Ausente', 'Ausente', 'Ausente'], l: ['1 h libre', 'Sin tiempo', 'Sin tiempo', 'Sin tiempo', 'Sin tiempo'] }
const LUIS = { w: [0.33, 0.33, 0.33, 0.83, 0.83], h: ['2/6 h', '2/6 h', '2/6 h', '5/6 h', '5/6 h'], l: ['4 h libres', '4 h libres', '4 h libres', '1 h libre', '1 h libre'] }
const APORTE = [[43, 29, 28], [0, 50, 50], [0, 50, 50], [0, 71, 29], [0, 71, 29]]
const NOMBRES = ['Ana', 'Luis', 'Sol']

function Aporte({ valores, mini }: { valores: number[]; mini?: boolean }) {
  return (
    <div className={`in-apo ${mini ? 'in-apo-m' : ''}`}>
      {NOMBRES.map((n, i) => (
        <div className="in-apo-f" key={n}>
          <span className="in-apo-n">{n}</span>
          <span className="in-barra"><span className="in-llena" style={{ transform: `scaleX(${valores[i] / 100})` }} /></span>
          <span className="in-apo-p num"><Cuenta a={valores[i]} ms={900} />%</span>
        </div>
      ))}
    </div>
  )
}

function Vista() {
  const t = useTextos()
  const foco = t.foco
  const activo = useActivo()
  const quieto = useQuieto()
  const [pasoV, setPaso] = useState(0)
  const paso = quieto ? FINAL : pasoV
  useEffect(() => {
    if (quieto) return
    if (!activo) return
    const t = window.setTimeout(() => setPaso((p) => (p + 1) % DUR.length), DUR[pasoV])
    return () => window.clearTimeout(t)
  }, [pasoV, activo, quieto])

  const eq = useContador(EQ[paso], 1400)
  const alto = EQ[paso] < 100
  const ausente = paso >= 1
  const cubierta = paso >= FINAL
  const msgs = [[0], [1], [2], [3, 4]]
  return (
    <div className={`in-ventana in-foco-${foco}`} aria-hidden="true">
      <div className="in-vcab"><i /><i /><i /><span>TeamGuard</span></div>
      <div className="in-vcuerpo">
        <div className="in-vlado">
          <b>{t.vistaPrevia}</b>
          <span className="on"><Icono nombre="tablero" tam={14} />Tablero</span><span><Icono nombre="tareas" tam={14} />Tareas</span><span><Icono nombre="integrantes" tam={14} />Integrantes</span><span><Icono nombre="entrega" tam={14} />Entrega</span>
        </div>
        <div className="in-vpag">
          <div className="in-vtop">
            <div>
              <h3><Icono nombre="tablero" tam={22} />Tablero</h3>
              <p className="in-vsub">Carga por persona</p>
            </div>
            <div className={`in-eq ${alto ? 'alto' : ''}`}>
              <small>Equilibrio</small>
              <span className="in-eq-n num">{eq}</span>
              <span className="in-eq-t">{alto ? 'Riesgo Alto' : 'Riesgo Bajo'}</span>
            </div>
          </div>
          {[
            { n: 'Ana', d: ANA, chips: <span className={`in-chip ${ausente ? 'al' : ''} ${cubierta ? 'fuera' : ''}`}>{ausente ? 'Boceto · Sin cubrir' : 'Boceto'}</span> },
            { n: 'Luis', d: LUIS, chips: <><span className="in-chip">Ficha</span><span className={`in-chip nuevo ${cubierta ? 'dentro' : ''}`}>Boceto</span></> },
            { n: 'Sol', d: { w: [0.5, 0.5, 0.5, 0.5, 0.5], h: Array(5).fill('2/4 h'), l: Array(5).fill('2 h libres') }, chips: <span className="in-chip">Resumen</span> },
          ].map((f) => (
            <div className="in-fila" key={f.n}>
              <span className="in-fn">{f.n} <span className="num fa">{f.d.h[paso]}</span><small className="in-chips">{f.chips}</small></span>
              <span className="in-barra"><span className="in-llena" style={{ transform: `scaleX(${f.d.w[paso]})` }} /></span>
              <span className={`tag tag-gris in-et ${f.n === 'Ana' && ausente ? 'al' : ''}`}>{f.d.l[paso]}</span>
            </div>
          ))}
          <div className="in-vabajo">
            <div className="in-vcaja">
              <small>Aporte</small>
              <Aporte valores={APORTE[paso]} mini={foco === 'equilibrio'} />
            </div>
            <div className="in-vprop">
              <div className={`in-m ${msgs[0].includes(paso) ? 'on' : ''}`}><Icono nombre="check" tam={14} /><span><b>Todo cabe</b> en el tiempo real de cada quien.</span></div>
              <div className={`in-m al ${msgs[1].includes(paso) ? 'on' : ''}`}><Icono nombre="alerta" tam={14} /><span><b>Ana se ausenta</b> · Boceto queda sin cubrir.</span></div>
              <div className={`in-m ${msgs[2].includes(paso) ? 'on' : ''}`}><Icono nombre="contingencia" tam={14} /><span><b>Luis cubre Boceto</b> (2 → 5 de 6 h) <span className="in-ok">Aceptada</span></span></div>
              <div className={`in-m ${msgs[3].includes(paso) ? 'on' : ''}`}><Icono nombre="check" tam={14} /><span><b>Cobertura aplicada.</b> Decidió una persona.</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Cinta continua ---------- */
function Cinta() {
  const { eventos } = useTextos()
  const grupo = (oculto: boolean) => (
    <ul className="in-grupo" aria-hidden={oculto || undefined}>
      {eventos.map((e) => <li key={e.t} className={e.al ? 'al' : ''}><Icono nombre={e.i} tam={16} />{e.t}</li>)}
    </ul>
  )
  return (
    <div className="in-cinta" role="group" aria-label="Eventos de ejemplo de un equipo">
      <div className="in-pista">{grupo(false)}{grupo(true)}</div>
    </div>
  )
}

/* ---------- Bento ---------- */
function CardAporte() {
  const { aporte } = useTextos()
  const activo = useActivo()
  const quieto = useQuieto()
  const [alt, setAlt] = useState(false)
  useEffect(() => {
    if (quieto || !activo) return
    const t = window.setInterval(() => setAlt((v) => !v), 3200)
    return () => window.clearInterval(t)
  }, [activo, quieto])
  return (
    <article className="in-card in-grande-c" id="tablero" style={{ ['--k' as string]: 0 }}>
      <div className="in-card-t">
        <h3>{aporte.t}</h3>
        <p>{aporte.p}</p>
      </div>
      <div className="in-card-v" aria-hidden="true">
        <div className="in-apo-cab"><small>Aporte por persona · % de las horas</small><small className="in-apo-cap">{alt ? 'Ana ausente · Luis cubre' : 'Reparto normal'}</small></div>
        <Aporte valores={alt ? APORTE[3] : APORTE[0]} />
        <div className="in-apo-eq"><span>Equilibrio</span><b className="num"><Cuenta a={100} /></b><span className="in-eq-t">Riesgo Bajo</span></div>
      </div>
    </article>
  )
}

function CardEquilibrio() {
  const { equilibrio } = useTextos()
  const activo = useActivo()
  const quieto = useQuieto()
  const [paso, setPaso] = useState(0)
  useEffect(() => {
    if (quieto || !activo) return
    const t = window.setInterval(() => setPaso((v) => (v + 1) % 3), 2600)
    return () => window.clearInterval(t)
  }, [activo, quieto])
  const valor = quieto ? 100 : [100, 57, 100][paso]
  const alto = valor < 100
  return (
    <article className="in-card in-grande-c" id="tablero" style={{ ['--k' as string]: 0 }}>
      <div className="in-card-t">
        <h3>{equilibrio.t}</h3>
        <p>{equilibrio.p}</p>
      </div>
      <div className="in-card-v" aria-hidden="true">
        <div className={`in-eq-gr in-eq ${alto ? 'alto' : ''}`}>
          <small>Equilibrio del equipo</small>
          <span className="in-eq-n num"><Cuenta a={valor} ms={900} /></span>
          <span className="in-eq-t">{alto ? 'Riesgo Alto' : 'Riesgo Bajo'}</span>
        </div>
        <div className="in-eq-pasos">{[100, 57, 100].map((v, i) => <span key={i} className={!quieto && paso === i ? 'on' : ''}>{v}</span>)}</div>
      </div>
    </article>
  )
}

function CardActa() {
  const { acta } = useTextos()
  return (
    <article className="in-card" id="entrega" style={{ ['--k' as string]: 2 }}>
      <div className="in-ciclo in-acta" aria-hidden="true">
        <ul>
          <li><time className="num">11:40</time>Ana se ausenta<span className="num">100 → 57</span></li>
          <li><time className="num">11:41</time>Luis cubre Boceto<span className="num">57 → 100</span></li>
        </ul>
      </div>
      <h3>{acta.t}</h3>
      <p>{acta.p}</p>
    </article>
  )
}

function CardCobertura() {
  const { cobertura } = useTextos()
  return (
    <article className="in-card" id="contingencia" style={{ ['--k' as string]: 1 }}>
      <div className="in-ciclo in-cob" aria-hidden="true">
        <div className="in-av in-av-a"><span>A</span><i /></div>
        <div className="in-via"><span className="in-tarea">Boceto</span></div>
        <div className="in-av in-av-l"><span>L</span><small className="num">5/6 h</small></div>
      </div>
      <h3>{cobertura.t}</h3>
      <p>{cobertura.p}</p>
    </article>
  )
}

function CardEntrega() {
  const { entrega } = useTextos()
  return (
    <article className="in-card" id="entrega" style={{ ['--k' as string]: 2 }}>
      <div className="in-ciclo in-ent" aria-hidden="true">
        <div className="in-arch">
          {['boceto.fig', 'ficha.pdf', 'resumen.docx'].map((f, i) => <span key={f} className="in-fi" style={{ ['--j' as string]: i }}><Icono nombre="texto" tam={13} />{f}</span>)}
        </div>
        <div className="in-zip"><Icono nombre="entrega" tam={22} /><b>ZIP</b><span className="in-listo"><Icono nombre="check" tam={12} />listo</span></div>
      </div>
      <h3>{entrega.t}</h3>
      <p>{entrega.p}</p>
    </article>
  )
}

const PRODUCTO = [
  { href: '#tablero', t: 'Tablero', d: 'Carga de cada persona' },
  { href: '#contingencia', t: 'Contingencia', d: 'Quién cubre una ausencia' },
  { href: '#entrega', t: 'Entrega', d: 'El ZIP con todo' },
] as const

function Barra({ version, tema, acento, onAcento, onTema, onEmpezar, onEjemplo, logo }: { version: Version; tema: Tema; acento: Acento; onAcento: (a: Acento) => void; onTema: () => void; onEmpezar: () => void; onEjemplo: () => void; logo: string }) {
  const [producto, setProducto] = useState(false)
  const [menu, setMenu] = useState(false)
  const [colores, setColores] = useState(false)
  const btnColores = useRef<HTMLButtonElement>(null)
  const caja = useRef<HTMLElement>(null)
  const btnProducto = useRef<HTMLButtonElement>(null)
  const btnMenu = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!producto && !menu && !colores) return
    const fuera = (e: PointerEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) { setProducto(false); setMenu(false); setColores(false) }
    }
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (colores) btnColores.current?.focus()
      else if (producto) btnProducto.current?.focus()
      else btnMenu.current?.focus()
      setProducto(false); setMenu(false); setColores(false)
    }
    document.addEventListener('pointerdown', fuera)
    document.addEventListener('keydown', tecla)
    return () => { document.removeEventListener('pointerdown', fuera); document.removeEventListener('keydown', tecla) }
  }, [producto, menu, colores])

  const cerrar = () => { setProducto(false); setMenu(false); setColores(false) }
  // Las anclas desplazan sin tocar el hash: la ruta #/estudiantes o #/empresas se conserva.
  const ir = (e: MouseEvent<HTMLAnchorElement>) => {
    const id = e.currentTarget.getAttribute('href')?.slice(1)
    const el = id ? document.getElementById(id) : null
    if (!el) return
    e.preventDefault()
    cerrar()
    el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
  }
  const claro = tema === 'oscuro'
  return (
    <header className="in-nav" ref={caja}>
      <a className="in-marca" href="#inicio" aria-label="TeamGuard"><img src={logo} alt="" width="28" height="28" />TeamGuard</a>
      <nav className="in-links" aria-label="Principal">
        <div className="in-drop">
          <button ref={btnProducto} type="button" className="in-link" aria-expanded={producto} aria-controls="in-producto" onClick={() => setProducto((v) => !v)}>
            Producto <span className="in-caret" aria-hidden="true" />
          </button>
          {producto && (
            <ul id="in-producto" className="in-pop">
              {PRODUCTO.map((x) => (
                <li key={x.href}><a href={x.href} onClick={ir}><b>{x.t}</b><span>{x.d}</span></a></li>
              ))}
            </ul>
          )}
        </div>
        <a className="in-link" href="#como" onClick={ir}>Cómo funciona</a>
        <a className="in-link" href="#privacidad" onClick={ir}>Privacidad</a>
        <a className="in-link" href="#creditos" onClick={ir}>Créditos</a>
      </nav>
      <div className="in-nav-d">
        <SelectorVersion className="sv-nav" version={version} onVersion={irAVersion} />
        <div className="in-drop in-colores">
          <button ref={btnColores} type="button" className="in-icobtn" aria-expanded={colores} aria-controls="in-acento" aria-label="Color de acento" onClick={() => { setProducto(false); setColores((v) => !v) }}><span className="in-gota" aria-hidden="true" /></button>
          {colores && <div id="in-acento" className="in-pop in-pop-ac"><SelectorAcento acento={acento} onAcento={onAcento} /></div>}
        </div>
        <button type="button" className="in-icobtn in-tema" onClick={onTema} aria-label={claro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}><Icono nombre={claro ? 'sol' : 'luna'} tam={18} /></button>
        <button type="button" className="in-link in-ver" onClick={onEjemplo}>Ver ejemplo</button>
        <button type="button" className="btn btn-p in-abrir" onClick={onEmpezar}><span>Abrir<span className="in-solo-d"> TeamGuard</span></span></button>
        <button ref={btnMenu} type="button" className="in-icobtn in-hamb" aria-expanded={menu} aria-controls="in-menu" aria-label={menu ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setMenu((v) => !v)}><Icono nombre={menu ? 'x' : 'menu'} tam={20} /></button>
      </div>
      {menu && (
        <div id="in-menu" className="in-panel">
          {PRODUCTO.map((x) => <a key={x.href} href={x.href} onClick={ir}>{x.t}</a>)}
          <a href="#como" onClick={ir}>Cómo funciona</a>
          <a href="#privacidad" onClick={ir}>Privacidad</a>
          <a href="#creditos" onClick={ir}>Créditos</a>
          <button type="button" onClick={() => { cerrar(); onEjemplo() }}>Ver ejemplo</button>
          <div className="in-panel-ac"><span>Color de acento</span><SelectorAcento acento={acento} onAcento={onAcento} /></div>
        </div>
      )}
    </header>
  )
}


export function Inicio({ tema, acento, onAcento, version, onTema, onEmpezar, onEjemplo }: Props) {
  const [saliendo, setSaliendo] = useState(false)
  const t = useTextos()
  const activo = useActivo()
  const temporizador = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(temporizador.current), [])

  const salir = (fn: () => void) => {
    if (saliendo) return
    setSaliendo(true)
    temporizador.current = window.setTimeout(fn, FUNDIDO_MS)
  }
  const logo = tema === 'oscuro' ? '/brand/tigre-blanco.png' : '/brand/tigre-negro.png'
  const ejemplo = () => salir(onEjemplo)
  const empezar = () => salir(onEmpezar)

  return (
    <div className={`in ${saliendo ? 'in-sale' : ''} ${activo ? '' : 'in-pausa'}`}>
      <Barra version={version} tema={tema} acento={acento} onAcento={onAcento} onTema={onTema} onEmpezar={empezar} onEjemplo={ejemplo} logo={logo} />

      <main id="inicio" key={version} className="in-entra">
        <section className="in-heroe">
          <div className="in-velo" aria-hidden="true" />
          <SelectorVersion className="sv-in in-e" version={version} onVersion={irAVersion} />
          <img className="in-tigre in-e" style={{ ['--i' as string]: 0 }} src={logo} alt="" width="56" height="56" />
          <p className="in-estado in-e" style={{ ['--i' as string]: 1 }}><span className="in-pt" /><span className="in-largo">{t.eyebrow}</span><span className="in-corto">{t.eyebrowCorto}</span></p>
          <h1 className="in-titulo">
            <span className="in-e" style={{ ['--i' as string]: 2 }}>{t.titulo.antes} <span className="in-capsula"><span className="in-punto" />{t.titulo.capsula}</span> {t.titulo.despues}</span>
            <span className="in-gris in-e" style={{ ['--i' as string]: 3 }}>{t.titulo.gris}</span>
          </h1>
          <p className="in-sub in-e" style={{ ['--i' as string]: 4 }}>{t.sub}</p>
          <div className="in-acciones in-e" style={{ ['--i' as string]: 5 }}>
            <button type="button" className="btn btn-p in-grande" onClick={empezar}>Empezar</button>
            <button type="button" className="btn in-grande in-suave" onClick={ejemplo}>Ver con datos de ejemplo</button>
          </div>
          <div className="in-vista in-e" style={{ ['--i' as string]: 6 }}><Vista /></div>
        </section>

        <Cinta />

        <Revela className="in-seccion">
          <h2 className="sr-only">Funciones</h2>
          <div className="in-bento">
            {t.foco === 'aporte' ? (
              <>
                <CardAporte />
                <CardCobertura />
                <CardEntrega />
              </>
            ) : (
              <>
                <CardEquilibrio />
                <CardCobertura />
                <CardActa />
              </>
            )}
          </div>
          <div className="in-bento-cta"><button type="button" className="btn in-grande in-suave" onClick={ejemplo}>Ver el ejemplo <Icono nombre="flecha" tam={16} /></button></div>
        </Revela>

        <Revela className="in-seccion">
          <section className="in-banda" id="privacidad">
            <h2>{t.banda.t}</h2>
            <div>
            <p>{t.banda.p1}</p>
            <p className="in-priv">{t.banda.p2}</p>
            </div>
          </section>
        </Revela>

        <Revela className="in-seccion in-oferta" id="como">
          <h2>{t.listaTitulo}</h2>
          <ol>
            {t.lista.map(([a, b], i) => (
              <li key={a}><span className="num">0{i + 1}</span><p><b>{a}</b>{b}</p></li>
            ))}
          </ol>
        </Revela>
      </main>

      <footer className="in-pie" id="creditos">
        <div className="in-marca"><img src={logo} alt="" width="24" height="24" />TeamGuard</div>
        <p>{t.lema}</p>
        <p className="in-chica">Hackatón UTCH 2026 · Datos de ejemplo</p>
      </footer>
    </div>
  )
}
