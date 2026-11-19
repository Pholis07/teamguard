import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Tema } from './formato'
import { Icono } from './bloques'
import './inicio.css'

type Props = { tema: Tema; onTema: () => void; onEmpezar: () => void; onEjemplo: () => void }

const FUNDIDO_MS = 300

/** Revela su contenido una sola vez al entrar en pantalla (opacidad + 16 px). */
function Revela({ children, className = '', retraso = 0, id }: { children: ReactNode; className?: string; retraso?: number; id?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visto, setVisto] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    // Sin IntersectionObserver, o si ya está en pantalla al cargar: se muestra sin esperar.
    if (typeof IntersectionObserver === 'undefined' || (r.top < window.innerHeight && r.bottom > 0)) { setVisto(true); return }
    const obs = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { setVisto(true); obs.disconnect() }
    }, { threshold: 0.12 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return <div ref={ref} id={id} className={`in-rev ${visto ? 'in-vis' : ''} ${className}`} style={{ transitionDelay: `${retraso}ms` }}>{children}</div>
}

const FILAS = [
  { n: 'Ana', c: 'Boceto', w: 75, e: '1 h libre' },
  { n: 'Luis', c: 'Ficha', w: 33, e: '4 h libres' },
  { n: 'Sol', c: 'Resumen', w: 50, e: '2 h libres' },
] as const
const HORAS = ['3/4 h', '2/6 h', '2/4 h']

function Vista() {
  return (
    <div className="in-ventana" aria-hidden="true">
      <div className="in-vcab"><i /><i /><i /><span>TeamGuard</span></div>
      <div className="in-vcuerpo">
        <div className="in-vlado">
          <b>Proyecto final de Diseño</b>
          <span className="on"><Icono nombre="tablero" tam={14} />Tablero</span><span><Icono nombre="tareas" tam={14} />Tareas</span><span><Icono nombre="integrantes" tam={14} />Integrantes</span><span><Icono nombre="entrega" tam={14} />Entrega</span>
        </div>
        <div className="in-vpag">
          <h3><Icono nombre="tablero" tam={22} />Tablero</h3>
          <p className="in-vsub">Carga por persona</p>
          {FILAS.map((f, i) => (
            <div className="in-fila" key={f.n}>
              <span className="in-fn">{f.n} <span className="num fa">{HORAS[i]}</span><small>{f.c}</small></span>
              <span className="in-barra"><span style={{ ['--w' as string]: `${f.w}%`, ['--d' as string]: `${1300 + i * 150}ms` }} className="in-llena" /></span>
              <span className="tag tag-gris">{f.e}</span>
            </div>
          ))}
          <div className="in-vprop"><Icono nombre="alerta" tam={14} /><span><b>Ana se ausenta</b> · Propuesta: Luis cubre Boceto (2 → 5 de 6 h). Tú decides.</span></div>
        </div>
      </div>
    </div>
  )
}

function DibujoCarga() {
  return (
    <svg viewBox="0 0 240 130" className="in-dib" aria-hidden="true">
      <rect x="1" y="1" width="238" height="128" rx="10" className="d-caja" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(18 ${22 + i * 26})`}>
          <circle cx="6" cy="6" r="6" className="d-suave" />
          <rect x="22" y="1" width="150" height="10" rx="5" className="d-pista" />
          <rect x="22" y="1" width={[70, 105, 150, 58][i]} height="10" rx="5" className={i === 2 ? 'd-fuerte' : 'd-medio'} />
        </g>
      ))}
    </svg>
  )
}
function DibujoCobertura() {
  return (
    <svg viewBox="0 0 240 130" className="in-dib" aria-hidden="true">
      <rect x="1" y="1" width="238" height="128" rx="10" className="d-caja" />
      <rect x="16" y="22" width="92" height="86" rx="8" className="d-pista" />
      <rect x="132" y="22" width="92" height="86" rx="8" className="d-suave" />
      {[0, 1, 2].map((i) => <rect key={i} x="26" y={34 + i * 22} width={[60, 44, 52][i]} height="10" rx="5" className="d-medio" />)}
      {[0, 1, 2].map((i) => <rect key={i} x="142" y={34 + i * 22} width={[40, 38, 36][i]} height="10" rx="5" className="d-medio" />)}
      <rect x="142" y="88" width="72" height="10" rx="5" className="d-fuerte" />
      <path d="M114 65h12m-5-5 5 5-5 5" className="d-trazo" />
    </svg>
  )
}
function DibujoZip() {
  return (
    <svg viewBox="0 0 240 130" className="in-dib" aria-hidden="true">
      <rect x="1" y="1" width="238" height="128" rx="10" className="d-caja" />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(18 ${20 + i * 30})`}>
          <rect width="22" height="24" rx="4" className="d-suave" />
          <rect x="32" y="7" width={[80, 64, 72][i]} height="10" rx="5" className="d-medio" />
        </g>
      ))}
      <path d="M142 65h20m-6-6 6 6-6 6" className="d-trazo" />
      <rect x="172" y="34" width="52" height="62" rx="8" className="d-fuerte" />
      <path d="M198 34v30" className="d-cierre" />
      <text x="198" y="86" textAnchor="middle" className="d-txt">ZIP</text>
    </svg>
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
    <div className={`in ${saliendo ? 'in-sale' : ''}`}>
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

        <Revela className="in-seccion">
          <h2 className="sr-only">Funciones</h2>
          <div className="in-cols">
            {[
              { id: 'tablero', d: <DibujoCarga />, t: 'Detecta la sobrecarga', p: 'Las barras de carga muestran quién va al límite antes de que el trabajo se acumule.' },
              { id: 'contingencia', d: <DibujoCobertura />, t: 'Cubre una ausencia', p: 'Si alguien falta, ves una propuesta de reparto, antes y después, para aprobarla o cambiarla.' },
              { id: 'entrega', d: <DibujoZip />, t: 'Une las entregas en un ZIP', p: 'Los archivos de cada integrante se reúnen en un solo paquete, tal como se subieron.' },
            ].map((c) => (
              <article className="in-col" key={c.t} id={c.id}>
                {c.d}
                <h3>{c.t}</h3>
                <p>{c.p}</p>
                <button type="button" className="in-pildora" onClick={ejemplo}>Ver cómo <Icono nombre="flecha" tam={14} /></button>
              </article>
            ))}
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
