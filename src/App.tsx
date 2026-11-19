import { useState } from 'react'

type Vista = 'tablero' | 'contingencia' | 'entrega'

const VISTAS: { id: Vista; label: string }[] = [
  { id: 'tablero', label: 'Tablero' },
  { id: 'contingencia', label: 'Contingencia' },
  { id: 'entrega', label: 'Entrega' },
]

// Estado compartido (integrantes, tareas, ausencia y archivos) se conecta
// aquí cuando B publique los tipos y datos en src/domain.
export default function App() {
  const [vista, setVista] = useState<Vista>('tablero')

  return (
    <div className="app">
      <header className="app-header">
        <h1>TeamGuard</h1>
        <nav>
          {VISTAS.map((v) => (
            <button
              key={v.id}
              className={vista === v.id ? 'activo' : ''}
              onClick={() => setVista(v.id)}
            >
              {v.label}
            </button>
          ))}
        </nav>
      </header>
      <main>
        {vista === 'tablero' && <p>Tablero (A · src/ui)</p>}
        {vista === 'contingencia' && <p>Contingencia (A + B · src/ui, src/domain)</p>}
        {vista === 'entrega' && <p>Entrega (C · src/delivery)</p>}
      </main>
    </div>
  )
}
