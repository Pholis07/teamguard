import { useState, type FormEvent } from 'react'
import { nombreValido, type Acento, type Tema } from './formato'
import { SelectorAcento } from './bloques'
import { useTextos, VERSIONES, type Version } from './version'
import './crear.css'

type Props = { tema: Tema; acento: Acento; onAcento: (a: Acento) => void; version: Version; onCambiarVersion: (v: Version) => void; onCrear: (nombre: string) => void; onEjemplo: () => void; onVolver: () => void }

/** Pantalla centrada para nombrar el proyecto antes de entrar al espacio de trabajo. */
export function CrearEspacio({ tema, acento, onAcento, version, onCambiarVersion, onCrear, onEjemplo, onVolver }: Props) {
  const t = useTextos()
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
        <button type="button" className="btn btn-g ce-volver" onClick={onVolver}>← Volver al inicio</button>
        <img src={logo} alt="" width="48" height="48" />
        <p className="ce-eyebrow">Nuevo espacio</p>
        <h1>Crea tu espacio</h1>
        <p className="ce-version">Versión {VERSIONES.find((v) => v.id === version)?.label} · <button type="button" className="ce-cambiar" onClick={() => onCambiarVersion(version === 'empresas' ? 'estudiantes' : 'empresas')}>cambiar</button></p>
        <label htmlFor="ce-nombre" className="ce-lbl">Nombre del proyecto</label>
        <input
          id="ce-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={t.placeholder}
          autoComplete="off" maxLength={80} autoFocus aria-invalid={intento && invalido} aria-describedby={intento && invalido ? 'ce-err' : undefined}
        />
        {intento && invalido && <p id="ce-err" className="ce-error" role="alert">Escribe un nombre para continuar.</p>}
        <button type="submit" className="btn btn-p ce-crear">Crear espacio</button>
        <button type="button" className="btn btn-g ce-sec" onClick={onEjemplo}>Usar datos de ejemplo</button>
        <div className="ce-acento"><span>Color de acento</span><SelectorAcento acento={acento} onAcento={onAcento} /></div>
      </form>
    </main>
  )
}
