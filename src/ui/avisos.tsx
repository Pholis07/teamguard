import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Icono } from './bloques'
import './avisos.css'

export type Aviso = {
  texto: string
  /** Si se da, el aviso muestra «Deshacer» y lo llama (y se cierra) al pulsarlo. */
  deshacer?: () => void
}
type Activo = Aviso & { id: number }

const DURACION = 5000
const MAXIMO = 3

const Contexto = createContext<{ avisar: (a: Aviso) => number; cerrar: (id: number) => void }>({ avisar: () => 0, cerrar: () => {} })

/** `avisar({ texto, deshacer? })` muestra un aviso de ~5 s (se pausa con el cursor o el foco) y devuelve su id. */
// oxlint-disable-next-line react/only-export-components -- el hook y su proveedor van juntos a propósito
export function useAvisos() {
  return useContext(Contexto)
}

function Tarjeta({ aviso, onCerrar: cerrarId }: { aviso: Activo; onCerrar: (id: number) => void }) {
  const [pausado, setPausado] = useState(false)
  const id = aviso.id
  const onCerrar = useCallback(() => cerrarId(id), [cerrarId, id])
  useEffect(() => {
    if (pausado) return
    const t = setTimeout(onCerrar, DURACION)
    return () => clearTimeout(t)
  }, [pausado, onCerrar])
  return (
    <li
      className="avisos-t" onMouseEnter={() => setPausado(true)} onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setPausado(false) }}
    >
      <span className="avisos-txt">{aviso.texto}</span>
      {aviso.deshacer && (
        <button type="button" className="avisos-des" onClick={() => { aviso.deshacer?.(); onCerrar() }}>Deshacer</button>
      )}
      <button type="button" className="avisos-x" aria-label="Cerrar aviso" onClick={onCerrar}><Icono nombre="x" tam={14} /></button>
    </li>
  )
}

export function AvisosProvider({ children }: { children: ReactNode }) {
  const [lista, setLista] = useState<Activo[]>([])
  const sig = useRef(1)
  const cerrar = useCallback((id: number) => setLista((l) => l.filter((a) => a.id !== id)), [])
  const avisar = useCallback((a: Aviso) => {
    const id = sig.current++
    setLista((l) => [...l, { ...a, id }].slice(-MAXIMO))
    return id
  }, [])

  // Esc cierra el aviso más reciente (salvo que haya un diálogo abierto, que lo usa para cerrarse).
  useEffect(() => {
    if (lista.length === 0) return
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || document.querySelector('dialog[open]')) return
      setLista((l) => l.slice(0, -1))
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [lista.length])

  const valor = useMemo(() => ({ avisar, cerrar }), [avisar, cerrar])
  return (
    <Contexto.Provider value={valor}>
      {children}
      <ul className="avisos" role="status" aria-live="polite" aria-label="Avisos">
        {lista.map((a) => <Tarjeta key={a.id} aviso={a} onCerrar={cerrar} />)}
      </ul>
    </Contexto.Provider>
  )
}
