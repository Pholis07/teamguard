import { useEffect, useState, type ReactNode } from 'react'
import { Icono } from './bloques'
import { PAGINAS, type PaginaId, type Proyecto, type Tema } from './formato'

type Props = {
  pagina: PaginaId
  proyecto: Proyecto
  contadores: { integrantes: number; tareas: number }
  tema: Tema
  onNavegar: (pagina: PaginaId) => void
  onTema: () => void
  onInicio: () => void
  onReiniciar: () => void
  children: ReactNode
}

/** Marco de la app: barra lateral de 240px, barra superior con migas y columna de página. En ≤760px la barra es un cajón. */
export function Shell({ pagina, proyecto, contadores, tema, onNavegar, onTema, onInicio, onReiniciar, children }: Props) {
  const [abierto, setAbierto] = useState(false)
  const actual = PAGINAS.find((p) => p.id === pagina)
  const cuentas: Partial<Record<PaginaId, number>> = { integrantes: contadores.integrantes, tareas: contadores.tareas }

  useEffect(() => {
    if (!abierto) return
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false)
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [abierto])

  const cerrandoAntes = (accion: () => void) => () => {
    setAbierto(false)
    accion()
  }

  return (
    <div className="n-app">
      <aside className="n-side" data-abierto={abierto} aria-label="Barra lateral">
        <button type="button" className="n-ws" onClick={cerrandoAntes(onInicio)} title="Volver al inicio">
          <img src={tema === 'oscuro' ? '/brand/tigre-blanco.png' : '/brand/tigre-negro.png'} alt="" width="20" height="20" />
          <span className="n-ws-txt"><b>TeamGuard</b><span>{proyecto.nombre}</span></span>
          <Icono nombre="chevron" tam={14} />
        </button>
        <label className="n-buscar">
          <Icono nombre="buscar" tam={14} />
          <input type="text" placeholder="Buscar" disabled aria-label="Buscar (no disponible)" />
          <kbd>Ctrl+K</kbd>
        </label>
        <button type="button" className="n-item" onClick={cerrandoAntes(onInicio)}>
          <span className="n-item-e" aria-hidden="true">🏠</span><span className="n-item-t">Inicio</span>
        </button>
        <p className="n-etq">Proyecto</p>
        <nav aria-label="Páginas del proyecto">
          {PAGINAS.map((p) => (
            <button key={p.id} type="button" className="n-item" aria-current={pagina === p.id ? 'page' : undefined} onClick={cerrandoAntes(() => onNavegar(p.id))}>
              <span className="n-item-e" aria-hidden="true">{p.emoji}</span>
              <span className="n-item-t">{p.label}</span>
              {cuentas[p.id] !== undefined && <span className="n-cuenta">{cuentas[p.id]}</span>}
            </button>
          ))}
        </nav>
        <div className="n-flex" />
        <button type="button" className="n-item" role="switch" aria-checked={tema === 'oscuro'} onClick={onTema}>
          <span className="n-item-e" aria-hidden="true">{tema === 'oscuro' ? '🌙' : '☀️'}</span>
          <span className="n-item-t">{tema === 'oscuro' ? 'Oscuro' : 'Claro'}</span>
        </button>
        <p className="n-lema">El trabajo es de todos. La responsabilidad también.</p>
        <button type="button" className="btn btn-g n-llat" onClick={cerrandoAntes(onReiniciar)}>Reiniciar demo</button>
      </aside>
      {abierto && <button type="button" className="n-velo" aria-label="Cerrar menú" onClick={() => setAbierto(false)} />}
      <div className="n-main">
        <header className="n-top">
          <button type="button" className="n-menu" aria-label="Abrir menú" aria-expanded={abierto} onClick={() => setAbierto(true)}><Icono nombre="menu" tam={18} /></button>
          <nav className="n-migas" aria-label="Ubicación">
            <span>🐯 {proyecto.nombre}</span>
            <span className="sep" aria-hidden="true">/</span>
            <b aria-current="page">{actual?.emoji} {actual?.label}</b>
          </nav>
          <span className="n-top-der">{proyecto.ejemplo ? 'Datos de ejemplo' : 'Proyecto nuevo'}</span>
        </header>
        <main className="n-pagina">{children}</main>
      </div>
    </div>
  )
}
