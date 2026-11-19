import { useEffect, useState } from 'react'
import { PASOS } from './guion'
import './presentar.css'

const reloj = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

type Props = {
  paso: number
  onIr: (paso: number) => void
  onSalir: () => void
  extra?: { label: string; onClick: () => void }
}

export function GuiaPresentacion({ paso, onIr, onSalir, extra }: Props) {
  const [inicio] = useState(() => Date.now())
  const [segundos, setSegundos] = useState(0)
  const actual = PASOS[paso]
  const ultimo = paso === PASOS.length - 1

  useEffect(() => {
    const id = setInterval(() => setSegundos(Math.floor((Date.now() - inicio) / 1000)), 250)
    return () => clearInterval(id)
  }, [inicio])

  // Teclado y presentadores inalámbricos (envían ←/→ o RePág/AvPág); no interfiere con selects ni campos.
  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      if ((e.target as HTMLElement).closest('input, select, textarea, dialog[open]')) return
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); if (!ultimo) onIr(paso + 1) }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); if (paso > 0) onIr(paso - 1) }
      // Con el menú lateral abierto (celular), Esc solo lo cierra; el guion sigue.
      else if (e.key === 'Escape' && !document.querySelector('[data-abierto="true"]')) onSalir()
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [paso, ultimo, onIr, onSalir])

  const tarde = segundos > actual.hasta

  return (
    <aside className="guia" aria-label="Guion de la presentación">
      <div className="guia-cabeza">
        <span className="num">Paso {paso + 1}/{PASOS.length} · {actual.titulo}</span>
        <span className={`num guia-reloj${tarde ? ' tarde' : ''}`} aria-label={`Tiempo ${reloj(segundos)} de 1:00`}>
          {reloj(segundos)} <span>/ {actual.desde}–{actual.hasta} s</span>
        </span>
      </div>
      <div className="guia-barra" aria-hidden="true">
        <span style={{ width: `${Math.min(100, (segundos / 60) * 100)}%` }} />
      </div>
      <p className="guia-decir" aria-live="polite">«{actual.decir}»</p>
      <p className="guia-hacer">{actual.hacer}</p>
      <div className="guia-acciones">
        {extra && <button className="btn guia-extra" onClick={extra.onClick}>{extra.label}</button>}
        <span className="guia-espacio" />
        <button className="btn guia-sec" onClick={() => onIr(paso - 1)} disabled={paso === 0}>Anterior</button>
        {ultimo
          ? <button className="btn guia-pri" onClick={onSalir}>Terminar</button>
          : <button className="btn guia-pri" onClick={() => onIr(paso + 1)}>Siguiente</button>}
      </div>
      <button className="guia-salir" onClick={onSalir} aria-label="Salir de la presentación">×</button>
    </aside>
  )
}
