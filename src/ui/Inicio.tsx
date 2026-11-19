import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { Tema } from './formato'
import { Icono } from './bloques'
import './inicio.css'

type Props = { tema: Tema; onTema: () => void; onEmpezar: (nombre: string) => void; onEjemplo: () => void }

const FUNDIDO_MS = 300

/** Revela su contenido una sola vez al entrar en pantalla (opacidad + 16 px). */
function Revela({ children, className = '', retraso = 0 }: { children: ReactNode; className?: string; retraso?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visto, setVisto] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { setVisto(true); obs.disconnect() }
    }, { threshold: 0.12 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return <div ref={ref} className={`in-rev ${visto ? 'in-vis' : ''} ${className}`} style={{ transitionDelay: `${retraso}ms` }}>{children}</div>
}

function IconoTema({ tema }: { tema: Tema }) {
  return (
    <svg className="icono" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {tema === 'oscuro'
        ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></>
        : <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />}
    </svg>
  )
}

const FILAS = [
  { n: 'Ana', c: 'Diseño', w: 48, t: 'verde', e: 'Con holgura' },
  { n: 'Luis', c: 'Programación', w: 82, t: 'naranja', e: 'Al límite' },
  { n: 'Marta', c: 'Documentación', w: 100, t: 'rojo', e: 'Sobrecarga' },
] as const

function Vista() {
  return (
    <div className="in-ventana" aria-hidden="true">
      <div className="in-vcab"><i /><i /><i /><span>TeamGuard</span></div>
      <div className="in-vcuerpo">
        <div className="in-vlado">
          <b>Proyecto final de Diseño</b>
          <span className="on">📋 Tablero</span><span>✅ Tareas</span><span>👥 Integrantes</span><span>📦 Entrega</span>
        </div>
        <div className="in-vpag">
          <h3>📋 Tablero</h3>
          <p className="in-vsub">Carga por persona esta semana</p>
          {FILAS.map((f, i) => (
            <div className="in-fila" key={f.n}>
              <span className="in-fn">{f.n}<small>{f.c}</small></span>
              <span className="in-barra"><span style={{ ['--w' as string]: `${f.w}%`, ['--d' as string]: `${1300 + i * 150}ms` }} className={`in-llena in-${f.t}`} /></span>
              <span className={`tag tag-${f.t}`}>{f.e}</span>
            </div>
          ))}
          <div className="in-vprop"><b>Propuesta para Marta</b> · Luis y Ana pueden tomar 2 tareas. Tú decides.</div>
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

export function Inicio({ tema, onTema, onEmpezar, onEjemplo }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [nombre, setNombre] = useState('')
  const [saliendo, setSaliendo] = useState(false)
  const campo = useRef<HTMLInputElement>(null)
  const temporizador = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(temporizador.current), [])
  useEffect(() => { if (abierto) campo.current?.focus() }, [abierto])

  const salir = (fn: () => void) => {
    if (saliendo) return
    setSaliendo(true)
    temporizador.current = window.setTimeout(fn, FUNDIDO_MS)
  }
  const crear = (e: FormEvent) => {
    e.preventDefault()
    const n = nombre.trim()
    if (n) salir(() => onEmpezar(n))
  }
  const logo = tema === 'oscuro' ? '/brand/tigre-blanco.png' : '/brand/tigre-negro.png'
  const ejemplo = () => salir(onEjemplo)

  return (
    <div className={`in ${saliendo ? 'in-sale' : ''}`}>
      <header className="in-nav">
        <a className="in-marca" href="#inicio" aria-label="TeamGuard"><img src={logo} alt="" width="28" height="28" />TeamGuard</a>
        <div className="in-nav-d">
          <button type="button" className="btn btn-g in-ver" onClick={ejemplo}>Ver ejemplo</button>
          <button type="button" className="btn btn-p" onClick={() => { setAbierto(true); campo.current?.focus() }}>Empezar</button>
          <button type="button" className="btn btn-g in-tema" onClick={onTema} aria-label={tema === 'oscuro' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}><IconoTema tema={tema} /></button>
        </div>
      </header>

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
            {!abierto ? (
              <>
                <button type="button" className="btn btn-p in-grande" onClick={() => setAbierto(true)}>Empezar</button>
                <button type="button" className="btn in-grande in-suave" onClick={ejemplo}>Ver con datos de ejemplo</button>
              </>
            ) : (
              <form className="in-form" onSubmit={crear} onKeyDown={(e) => { if (e.key === 'Escape') setAbierto(false) }}>
                <label htmlFor="in-nombre" className="in-lbl">Nombre del proyecto</label>
                <div className="in-campo">
                  <input id="in-nombre" ref={campo} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Proyecto final de Diseño" autoComplete="off" maxLength={80} />
                  <button type="submit" className="btn btn-p in-grande" disabled={nombre.trim() === ''}>Crear espacio</button>
                </div>
                <button type="button" className="btn btn-g in-cancelar" onClick={() => setAbierto(false)}>Cancelar</button>
              </form>
            )}
          </div>
          <div className="in-vista in-e" style={{ ['--i' as string]: 6 }}><Vista /></div>
        </section>

        <Revela className="in-seccion">
          <h2 className="sr-only">Funciones</h2>
          <div className="in-cols">
            {[
              { d: <DibujoCarga />, t: 'Detecta la sobrecarga', p: 'Las barras de carga muestran quién va al límite antes de que el trabajo se acumule.' },
              { d: <DibujoCobertura />, t: 'Cubre una ausencia', p: 'Si alguien falta, ves una propuesta de reparto, antes y después, para aprobarla o cambiarla.' },
              { d: <DibujoZip />, t: 'Une las entregas en un ZIP', p: 'Los archivos de cada integrante se reúnen en un solo paquete, tal como se subieron.' },
            ].map((c) => (
              <article className="in-col" key={c.t}>
                {c.d}
                <h3>{c.t}</h3>
                <p>{c.p}</p>
                <button type="button" className="in-pildora" onClick={ejemplo}>Ver cómo <Icono nombre="flecha" tam={14} /></button>
              </article>
            ))}
          </div>
        </Revela>

        <Revela className="in-seccion">
          <section className="in-banda">
            <h2>Nadie se queda con todo el trabajo.</h2>
            <p>Un sistema puede detectar que alguien va a rebasar su carga y sugerir cómo repartirla. Lo que no debe hacer es decidirlo solo. Por eso cada propuesta de TeamGuard espera la aprobación de una persona del equipo.</p>
          </section>
        </Revela>

        <Revela className="in-seccion in-oferta">
          <h2>Lo que hace TeamGuard</h2>
          <ol>
            {LISTA.map(([a, b], i) => (
              <li key={a}><span className="num">0{i + 1}</span><p><b>{a}</b>{b}</p></li>
            ))}
          </ol>
        </Revela>
      </main>

      <footer className="in-pie">
        <div className="in-marca"><img src={logo} alt="" width="24" height="24" />TeamGuard</div>
        <p>El trabajo es de todos. La responsabilidad también.</p>
        <p className="in-chica">Datos de ejemplo · Hackatón UTCH 2026</p>
      </footer>
    </div>
  )
}
