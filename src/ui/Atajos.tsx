import { useEffect, useRef } from 'react'
import './atajos.css'

const GRUPOS: { titulo: string; filas: { teclas: string[]; texto: string }[] }[] = [
  {
    titulo: 'Ir a una página',
    filas: [
      { teclas: ['1'], texto: 'Tablero' },
      { teclas: ['2'], texto: 'Integrantes' },
      { teclas: ['3'], texto: 'Tareas' },
      { teclas: ['4'], texto: 'Contingencia' },
      { teclas: ['5'], texto: 'Entrega' },
    ],
  },
  { titulo: 'En el Tablero', filas: [{ teclas: ['S'], texto: 'Abrir o cerrar la simulación' }] },
  {
    titulo: 'Al presentar',
    filas: [
      { teclas: ['←', '→'], texto: 'Paso anterior o siguiente' },
      { teclas: ['Esc'], texto: 'Salir de la presentación' },
    ],
  },
  { titulo: 'General', filas: [{ teclas: ['?'], texto: 'Ver estos atajos' }, { teclas: ['Esc'], texto: 'Cerrar un aviso o un diálogo' }] },
]

/** Diálogo modal nativo (`<dialog>`): atrapa el foco, Esc lo cierra y al cerrarse devuelve el foco a quien lo abrió. */
export function Atajos({ onCerrar }: { onCerrar: () => void }) {
  const dialogo = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = dialogo.current
    if (d && !d.open) d.showModal()
  }, [])
  return (
    <dialog
      ref={dialogo} className="atajos" aria-labelledby="atajos-t" onClose={onCerrar}
      onClick={(e) => { if (e.target === e.currentTarget) dialogo.current?.close() }}
    >
      <div className="atajos-cab">
        <h2 id="atajos-t" className="n-bd-tit">Atajos de teclado</h2>
        <button type="button" className="btn btn-g" onClick={() => dialogo.current?.close()}>Cerrar</button>
      </div>
      <p className="atajos-nota">No funcionan mientras escribes en un campo.</p>
      {GRUPOS.map((g) => (
        <section key={g.titulo} className="atajos-g" aria-label={g.titulo}>
          <h3>{g.titulo}</h3>
          <dl>
            {g.filas.map((f) => (
              <div key={f.texto} className="atajos-f">
                <dt>{f.teclas.map((k) => <kbd key={k}>{k}</kbd>)}</dt>
                <dd>{f.texto}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </dialog>
  )
}
