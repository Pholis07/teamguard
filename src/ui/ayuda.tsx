import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Icono } from './bloques'
import './ayuda.css'

/** Botón «i» junto a un título que abre un recuadro con 1–2 frases. Esc o un clic fuera lo cierran.
 *  El padre debe tener `position: relative` (clase `n-ayuda-cab`) para que el recuadro quede bajo el título. */
export function Ayuda({ tema, children }: { tema: string; children: ReactNode }) {
  const [abierta, setAbierta] = useState(false)
  const boton = useRef<HTMLButtonElement>(null)
  const recuadro = useRef<HTMLDivElement>(null)
  const id = useId()

  useEffect(() => {
    if (!abierta) return
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      setAbierta(false)
      boton.current?.focus()
    }
    const alPulsar = (e: PointerEvent) => {
      const el = e.target as Node
      if (!recuadro.current?.contains(el) && !boton.current?.contains(el)) setAbierta(false)
    }
    window.addEventListener('keydown', alTeclear, true)
    document.addEventListener('pointerdown', alPulsar)
    return () => {
      window.removeEventListener('keydown', alTeclear, true)
      document.removeEventListener('pointerdown', alPulsar)
    }
  }, [abierta])

  return (
    <>
      <button ref={boton} type="button" className="n-ayuda" aria-expanded={abierta} aria-controls={id} aria-label={`Qué es ${tema}`} onClick={() => setAbierta((a) => !a)}>
        <Icono nombre="info" tam={15} />
      </button>
      {abierta && <span ref={recuadro} id={id} className="n-ayuda-pop" role="region" aria-label={tema}>{children}</span>}
    </>
  )
}
