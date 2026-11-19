import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Tema } from './formato'
import { Icono, type NombreIcono } from './bloques'
import './inicio.css'

type Props = { tema: Tema; onTema: () => void; onEmpezar: () => void; onEjemplo: () => void }

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
    <div className="in-ventana" aria-hidden="true">
      <div className="in-vcab"><i /><i /><i /><span>TeamGuard</span></div>
      <div className="in-vcuerpo">
        <div className="in-vlado">
          <b>Proyecto final de Diseño</b>
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
              <Aporte valores={APORTE[paso]} mini />
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
const EVENTOS: { i: NombreIcono; t: string; al?: boolean }[] = [
  { i: 'ausencia', t: 'Ana se ausenta', al: true },
  { i: 'integrantes', t: 'Luis cubre Boceto' },
  { i: 'tablero', t: 'Equilibrio 57 → 100' },
  { i: 'check', t: 'Sol entregó Resumen' },
  { i: 'entrega', t: 'ZIP listo' },
  { i: 'simular', t: 'Simulación sin riesgo' },
  { i: 'candado', t: 'El motivo de una ausencia no se guarda' },
  { i: 'persona', t: 'Decide una persona' },
]
function Cinta() {
  const grupo = (oculto: boolean) => (
    <ul className="in-grupo" aria-hidden={oculto || undefined}>
      {EVENTOS.map((e) => <li key={e.t} className={e.al ? 'al' : ''}><Icono nombre={e.i} tam={16} />{e.t}</li>)}
    </ul>
  )
  return (
    <div className="in-cinta" role="group" aria-label="Eventos de ejemplo de un equipo">
      <div className="in-pista">{grupo(false)}{grupo(true)}</div>
    </div>
  )
}

/* ---------- Bento ---------- */
function CardAporte({ onEjemplo }: { onEjemplo: () => void }) {
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
        <h3>Ve cuánto aporta cada quien</h3>
        <p>La carga de cada persona y su parte del trabajo, a la vista. Si alguien se ausenta, el reparto cambia y el equilibrio te lo dice.</p>
        <button type="button" className="in-pildora" onClick={onEjemplo}>Ver cómo <Icono nombre="flecha" tam={14} /></button>
      </div>
      <div className="in-card-v" aria-hidden="true">
        <div className="in-apo-cab"><small>Aporte por persona · % de las horas</small><small className="in-apo-cap">{alt ? 'Ana ausente · Luis cubre' : 'Reparto normal'}</small></div>
        <Aporte valores={alt ? APORTE[3] : APORTE[0]} />
        <div className="in-apo-eq"><span>Equilibrio</span><b className={`num ${alt ? '' : ''}`}><Cuenta a={100} /></b><span className="in-eq-t">Riesgo Bajo</span></div>
      </div>
    </article>
  )
}

function CardCobertura({ onEjemplo }: { onEjemplo: () => void }) {
  return (
    <article className="in-card" id="contingencia" style={{ ['--k' as string]: 1 }}>
      <div className="in-ciclo in-cob" aria-hidden="true">
        <div className="in-av in-av-a"><span>A</span><i /></div>
        <div className="in-via"><span className="in-tarea">Boceto</span></div>
        <div className="in-av in-av-l"><span>L</span><small className="num">5/6 h</small></div>
      </div>
      <h3>Cubre una ausencia</h3>
      <p>Si alguien falta, ves una propuesta de reparto, antes y después, para aprobarla o cambiarla.</p>
      <button type="button" className="in-pildora" onClick={onEjemplo}>Ver cómo <Icono nombre="flecha" tam={14} /></button>
    </article>
  )
}

function CardEntrega({ onEjemplo }: { onEjemplo: () => void }) {
  return (
    <article className="in-card" id="entrega" style={{ ['--k' as string]: 2 }}>
      <div className="in-ciclo in-ent" aria-hidden="true">
        <div className="in-arch">
          {['boceto.fig', 'ficha.pdf', 'resumen.docx'].map((f, i) => <span key={f} className="in-fi" style={{ ['--j' as string]: i }}><Icono nombre="texto" tam={13} />{f}</span>)}
        </div>
        <div className="in-zip"><Icono nombre="entrega" tam={22} /><b>ZIP</b><span className="in-listo"><Icono nombre="check" tam={12} />listo</span></div>
      </div>
      <h3>Une las entregas en un ZIP</h3>
      <p>Los archivos de cada integrante se reúnen en un solo paquete, tal como se subieron.</p>
      <button type="button" className="in-pildora" onClick={onEjemplo}>Ver cómo <Icono nombre="flecha" tam={14} /></button>
    </article>
  )
}

const LISTA = [
  ['Carga visible por persona.', ' Cada integrante ve cuántas horas tiene asignadas frente a las que tiene disponibles.'],
  ['Simulación sin riesgo.', ' Prueba un cambio de tareas y revisa su efecto antes de aplicarlo.'],
  ['Cobertura con aprobación humana.', ' Si alguien falta, TeamGuard propone quién cubre; la decisión es de una persona.'],
  ['ZIP con los archivos originales.', ' La entrega reúne lo que cada quien subió, sin cambiarlo.'],
] as const

const PRODUCTO = [
  { href: '#tablero', t: 'Tablero', d: 'Carga de cada persona' },
  { href: '#contingencia', t: 'Contingencia', d: 'Quién cubre una ausencia' },
  { href: '#entrega', t: 'Entrega', d: 'El ZIP con todo' },
] as const

function Barra({ tema, onTema, onEmpezar, onEjemplo, logo }: { tema: Tema; onTema: () => void; onEmpezar: () => void; onEjemplo: () => void; logo: string }) {
  const [producto, setProducto] = useState(false)
  const [menu, setMenu] = useState(false)
  const caja = useRef<HTMLElement>(null)
  const btnProducto = useRef<HTMLButtonElement>(null)
  const btnMenu = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!producto && !menu) return
    const fuera = (e: PointerEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) { setProducto(false); setMenu(false) }
    }
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (producto) btnProducto.current?.focus()
      else btnMenu.current?.focus()
      setProducto(false); setMenu(false)
    }
    document.addEventListener('pointerdown', fuera)
    document.addEventListener('keydown', tecla)
    return () => { document.removeEventListener('pointerdown', fuera); document.removeEventListener('keydown', tecla) }
  }, [producto, menu])

  const cerrar = () => { setProducto(false); setMenu(false) }
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
                <li key={x.href}><a href={x.href} onClick={cerrar}><b>{x.t}</b><span>{x.d}</span></a></li>
              ))}
            </ul>
          )}
        </div>
        <a className="in-link" href="#como">Cómo funciona</a>
        <a className="in-link" href="#privacidad">Privacidad</a>
        <a className="in-link" href="#equipo">Equipo</a>
      </nav>
      <div className="in-nav-d">
        <button type="button" className="in-icobtn in-tema" onClick={onTema} aria-label={claro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}><Icono nombre={claro ? 'sol' : 'luna'} tam={18} /></button>
        <button type="button" className="in-link in-ver" onClick={onEjemplo}>Ver ejemplo</button>
        <button type="button" className="btn btn-p in-abrir" onClick={onEmpezar}><span>Abrir<span className="in-solo-d"> TeamGuard</span></span></button>
        <button ref={btnMenu} type="button" className="in-icobtn in-hamb" aria-expanded={menu} aria-controls="in-menu" aria-label={menu ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setMenu((v) => !v)}><Icono nombre={menu ? 'x' : 'menu'} tam={20} /></button>
      </div>
      {menu && (
        <div id="in-menu" className="in-panel">
          {PRODUCTO.map((x) => <a key={x.href} href={x.href} onClick={cerrar}>{x.t}</a>)}
          <a href="#como" onClick={cerrar}>Cómo funciona</a>
          <a href="#privacidad" onClick={cerrar}>Privacidad</a>
          <a href="#equipo" onClick={cerrar}>Equipo</a>
          <button type="button" onClick={() => { cerrar(); onEjemplo() }}>Ver ejemplo</button>
        </div>
      )}
    </header>
  )
}


export function Inicio({ tema, onTema, onEmpezar, onEjemplo }: Props) {
  const [saliendo, setSaliendo] = useState(false)
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
      <Barra tema={tema} onTema={onTema} onEmpezar={empezar} onEjemplo={ejemplo} logo={logo} />

      <main id="inicio">
        <section className="in-heroe">
          <div className="in-velo" aria-hidden="true" />
          <img className="in-tigre in-e" style={{ ['--i' as string]: 0 }} src={logo} alt="" width="56" height="56" />
          <p className="in-estado in-e" style={{ ['--i' as string]: 1 }}><span className="in-pt" />Hecho para equipos de proyecto</p>
          <h1 className="in-titulo">
            <span className="in-e" style={{ ['--i' as string]: 2 }}>El trabajo es de <span className="in-capsula"><span className="in-punto" />todos</span>.</span>
            <span className="in-gris in-e" style={{ ['--i' as string]: 3 }}>La responsabilidad también.</span>
          </h1>
          <p className="in-sub in-e" style={{ ['--i' as string]: 4 }}>TeamGuard reparte las horas del equipo, avisa antes de una sobrecarga y propone quién cubre una ausencia. Siempre decide una persona.</p>
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
            <CardAporte onEjemplo={ejemplo} />
            <CardCobertura onEjemplo={ejemplo} />
            <CardEntrega onEjemplo={ejemplo} />
          </div>
        </Revela>

        <Revela className="in-seccion">
          <section className="in-banda" id="privacidad">
            <h2>Nadie se queda con todo el trabajo.</h2>
            <div>
            <p>Un sistema puede detectar que alguien va a rebasar su carga y sugerir cómo repartirla. Lo que no debe hacer es decidirlo solo. Por eso cada propuesta de TeamGuard espera la aprobación de una persona del equipo.</p>
            <p className="in-priv">El motivo de una ausencia nunca se guarda; todo vive en esta pestaña.</p>
            </div>
          </section>
        </Revela>

        <Revela className="in-seccion in-oferta" id="como">
          <h2>Lo que hace TeamGuard</h2>
          <ol>
            {LISTA.map(([a, b], i) => (
              <li key={a}><span className="num">0{i + 1}</span><p><b>{a}</b>{b}</p></li>
            ))}
          </ol>
        </Revela>
      </main>

      <footer className="in-pie" id="equipo">
        <div className="in-marca"><img src={logo} alt="" width="24" height="24" />TeamGuard</div>
        <p>El trabajo es de todos. La responsabilidad también.</p>
        <p className="in-chica">Datos de ejemplo · Hackatón UTCH 2026</p>
      </footer>
    </div>
  )
}
