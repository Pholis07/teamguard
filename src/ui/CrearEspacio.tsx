import { useState, type FormEvent } from 'react'
import { nombreValido, type Tema } from './formato'
import './crear.css'

type Props = { tema: Tema; onCrear: (nombre: string) => void; onEjemplo: () => void; onVolver: () => void }

/** Pantalla centrada para nombrar el proyecto antes de entrar al espacio de trabajo. */
export function CrearEspacio({ tema, onCrear, onEjemplo, onVolver }: Props) {
  const [nombre, setNombre] = useState('')
  const [intento, setIntento] = useState(false)
  const logo = tema === 'oscuro' ? '/brand/tigre-blanco.png' : '/brand/tigre-negro.png'
  const invalido = !nombreValido(nombre)

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (invalido) return setIntento(true)
    onCrear(nombre.trim())
  }

  return (
    <main className="ce">
      <form className="ce-tarjeta" onSubmit={enviar} noValidate>
        <img src={logo} alt="" width="48" height="48" />
        <p className="ce-eyebrow">Nuevo espacio</p>
        <h1>Crea tu espacio</h1>
        <label htmlFor="ce-nombre" className="ce-lbl">Nombre del proyecto</label>
        <input
          id="ce-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Proyecto final de Diseño"
          autoComplete="off" maxLength={80} autoFocus aria-invalid={intento && invalido} aria-describedby={intento && invalido ? 'ce-err' : undefined}
        />
        {intento && invalido && <p id="ce-err" className="ce-error" role="alert">Escribe un nombre para continuar.</p>}
        <button type="submit" className="btn btn-p ce-crear">Crear espacio</button>
        <button type="button" className="btn btn-g ce-sec" onClick={onEjemplo}>Usar datos de ejemplo</button>
      </form>
      <button type="button" className="btn btn-g ce-volver" onClick={onVolver}>← Volver al inicio</button>
    </main>
  )
}
