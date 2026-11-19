import { useEffect, useState, type ReactNode } from 'react'
import { Icono, SelectorAcento } from './bloques'
import { useTextos } from './version'
import { PAGINAS, type PaginaId, type Acento, type Proyecto, type Tema } from './formato'

type Props = {
  pagina: PaginaId
  proyecto: Proyecto
  contadores: { integrantes: number; tareas: number; entrega?: string }
  tema: Tema
  acento: Acento
  onAcento: (a: Acento) => void
  onNavegar: (pagina: PaginaId) => void
  onTema: () => void
  onInicio: () => void
  onReiniciar: () => void
  /** Acciones a la derecha de la barra superior (Compartir, Presentar). */
  acciones?: ReactNode
  children: ReactNode
}

/** Marco de la app: barra lateral de 240px, barra superior con migas y columna de página. En ≤760px la barra es un cajón. */
export function Shell({ pagina, proyecto, contadores, tema, acento, onAcento, onNavegar, onTema, onInicio, onReiniciar, acciones, children }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const t = useTextos()
  const etiqueta = (p: (typeof PAGINAS)[number]) => (p.id === 'integrantes' ? t.pagina.integrantes : p.label)
  const actual = PAGINAS.find((p) => p.id === pagina)
  const cuentas: Partial<Record<PaginaId, number | string>> = { integrantes: contadores.integrantes, tareas: contadores.tareas, entrega: contadores.entrega }

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
        <button type="button" className="n-item" onClick={cerrandoAntes(onInicio)}>
          <span className="n-item-e" aria-hidden="true"><Icono nombre="inicio" /></span><span className="n-item-t">Inicio</span>
        </button>
        <p className="n-etq">Proyecto</p>
        <nav aria-label="Páginas del proyecto">
          {PAGINAS.map((p) => (
            <button key={p.id} type="button" className="n-item" aria-current={pagina === p.id ? 'page' : undefined} onClick={cerrandoAntes(() => onNavegar(p.id))}>
              <span className="n-item-e" aria-hidden="true"><Icono nombre={p.icono} /></span>
              <span className="n-item-t">{etiqueta(p)}</span>
              {cuentas[p.id] !== undefined && <span className="n-cuenta">{cuentas[p.id]}</span>}
            </button>
          ))}
        </nav>
        <div className="n-flex" />
        <button type="button" className="n-item" role="switch" aria-checked={tema === 'oscuro'} onClick={onTema}>
          <span className="n-item-e" aria-hidden="true"><Icono nombre={tema === 'oscuro' ? 'luna' : 'sol'} /></span>
          <span className="n-item-t">{tema === 'oscuro' ? 'Oscuro' : 'Claro'}</span>
        </button>
        <div className="n-acento"><span>Acento</span><SelectorAcento acento={acento} onAcento={onAcento} /></div>
        <p className="n-lema">{t.lema}</p>
        {confirmando ? (
          <div className="n-confirma n-llat" role="group" aria-label="Confirmar reinicio">
            <span>¿Borrar tus cambios y volver a los datos de ejemplo?</span>
            <button type="button" className="btn btn-s" onClick={() => { setConfirmando(false); cerrandoAntes(onReiniciar)() }}>Sí, reiniciar</button>
            <button type="button" className="btn btn-t" onClick={() => setConfirmando(false)}>No</button>
          </div>
        ) : (
          <button type="button" className="btn btn-t n-reiniciar n-llat" onClick={() => setConfirmando(true)}>Reiniciar demo</button>
        )}
      </aside>
      {abierto && <button type="button" className="n-velo" aria-label="Cerrar menú" onClick={() => setAbierto(false)} />}
      <div className="n-main">
        <header className="n-top">
          <button type="button" className="n-menu" aria-label="Abrir menú" aria-expanded={abierto} onClick={() => setAbierto(true)}><Icono nombre="menu" tam={18} /></button>
          <nav className="n-migas" aria-label="Ubicación">
            <span>{proyecto.nombre}</span>
            <span className="sep" aria-hidden="true">/</span>
            <b aria-current="page">{actual && <Icono nombre={actual.icono} />}{actual && etiqueta(actual)}</b>
          </nav>
          <span className="n-top-der">
            <span className="n-estado">{proyecto.ejemplo ? 'Datos de ejemplo' : 'Proyecto nuevo'}</span>
            {acciones}
          </span>
        </header>
        <main className="n-pagina">{children}</main>
      </div>
    </div>
  )
}
