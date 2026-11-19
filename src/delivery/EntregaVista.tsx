import { useState } from 'react'
import type { Member, Task } from '../domain'
import { actaEntrega, type Decision } from './acta'
import { armarZip, NOMBRE_ACTA, progresoEntrega, type Entrega } from './zip'
import './entrega.css'

type Props = {
  tasks: readonly Task[]
  members: readonly Member[]
  files: readonly Entrega[]
  decisiones: readonly Decision[]
  onAddFile: (entrega: Entrega) => void
}

export function EntregaVista({ tasks, members, files, decisiones, onAddFile }: Props) {
  const [error, setError] = useState<string | null>(null)
  const nombre = (id: string) => members.find((m) => m.id === id)?.name ?? id
  const avatar = (id: string) => `av av${members.findIndex((m) => m.id === id) + 1}`
  const { listas, total } = progresoEntrega(tasks, files)
  const faltan = total - listas

  async function descargar() {
    setError(null)
    try {
      const fecha = new Date().toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short', hourCycle: 'h23' })
      const acta = actaEntrega(files, tasks, members, decisiones, fecha)
      const blob = await armarZip(files, tasks, members, acta).generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const enlace = document.createElement('a')
      enlace.href = url
      enlace.download = 'teamguard-entregas.zip'
      enlace.click()
      setTimeout(() => URL.revokeObjectURL(url))
    } catch {
      setError('No se pudo generar el ZIP. Intenta de nuevo.')
    }
  }

  return (
    <>
      <header className="entrega-cabecera">
        <h1>
          <span role="status">
            {listas} de {total} entregas listas.{' '}
            <span className="fa">
              {faltan > 0 ? `Falta archivo en ${faltan} tarea(s) obligatoria(s).` : 'Ya se puede descargar el ZIP.'}
            </span>
          </span>
        </h1>
        <button className="btn btn-p" disabled={faltan > 0} onClick={descargar}>
          Descargar ZIP
        </button>
      </header>
      {error && (
        <p role="alert" className="chip c-wa">
          {error}
        </p>
      )}
      <section aria-labelledby="h-entregas" className="entrega-seccion">
        <h2 id="h-entregas">Archivos por tarea</h2>
        <ul className="panel entrega-lista">
          {tasks.map((t) => {
            const propios = files.filter((f) => f.taskId === t.id)
            return (
              <li key={t.id} className="entrega-fila">
                <span className="entrega-tarea">
                  <span className={avatar(t.ownerId)}>{nombre(t.ownerId)[0]}</span>
                  <span>
                    <span className="entrega-titulo">{t.title}</span>
                    <span className="fa entrega-sub">responsable: {nombre(t.ownerId)}</span>
                  </span>
                </span>
                <span className="entrega-archivos">
                  {propios.length === 0 ? (
                    <span className="fa">Sin archivo</span>
                  ) : (
                    propios.map((f, i) => (
                      <span key={i}>
                        {f.file.name} <span className="fa">· subido por {nombre(f.uploaderId)}</span>
                      </span>
                    ))
                  )}
                </span>
                {t.requiresFile &&
                  (propios.length > 0 ? (
                    <span className="chip c-ok">✓ Lista</span>
                  ) : (
                    <span className="chip c-wa">Falta archivo</span>
                  ))}
                <label className="btn btn-s">
                  Adjuntar<span className="sr-only"> a {t.title}</span>
                  <input
                    type="file"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      // Autor = responsable al momento de subir; una reasignación posterior no lo cambia.
                      for (const file of Array.from(e.target.files ?? [])) {
                        onAddFile({ taskId: t.id, uploaderId: t.ownerId, file })
                      }
                      e.target.value = ''
                    }}
                  />
                </label>
              </li>
            )
          })}
        </ul>
      </section>
      <section aria-labelledby="h-decisiones" className="entrega-seccion">
        <div className="entrega-seccion-cabeza">
          <h2 id="h-decisiones">Decisiones del equipo</h2>
          <span className="fa">El ZIP incluye {NOMBRE_ACTA} con este registro.</span>
        </div>
        <ol className="panel entrega-lista bitacora">
          {decisiones.length === 0 ? (
            <li className="entrega-fila fa">
              Todavía no hay decisiones. Las ausencias y las coberturas aceptadas aparecen aquí.
            </li>
          ) : (
            decisiones.map((d, i) => (
              <li key={i} className="entrega-fila">
                <span className="num fa">{d.hora}</span>
                <span>{d.texto}</span>
              </li>
            ))
          )}
        </ol>
      </section>
    </>
  )
}
