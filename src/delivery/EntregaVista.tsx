import { useState } from 'react'
import type { Member, Task } from '../domain'
import { armarZip, type Entrega } from './zip'

type Props = {
  tasks: readonly Task[]
  members: readonly Member[]
  files: readonly Entrega[]
  onAddFile: (entrega: Entrega) => void
}

export function EntregaVista({ tasks, members, files, onAddFile }: Props) {
  const [error, setError] = useState<string | null>(null)
  const nombre = (id: string) => members.find((m) => m.id === id)?.name ?? id
  const obligatorias = tasks.filter((t) => t.requiresFile)
  const listas = obligatorias.filter((t) => files.some((f) => f.taskId === t.id)).length
  const faltan = obligatorias.length - listas

  async function descargar() {
    setError(null)
    try {
      const blob = await armarZip(files, tasks, members).generateAsync({ type: 'blob' })
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
    <section>
      <h2>Entrega unificada</h2>
      <p role="status">
        {listas} de {obligatorias.length} entregas listas
      </p>
      <ul>
        {tasks.map((t) => {
          const propios = files.filter((f) => f.taskId === t.id)
          return (
            <li key={t.id}>
              <h3>
                {t.title} · responsable: {nombre(t.ownerId)}
                {t.requiresFile && (propios.length > 0 ? ' · ✓ lista' : ' · falta archivo')}
              </h3>
              {propios.length > 0 && (
                <ul>
                  {propios.map((f, i) => (
                    <li key={i}>
                      {f.file.name} · subido por {nombre(f.uploaderId)}
                    </li>
                  ))}
                </ul>
              )}
              <label>
                Adjuntar a {t.title}{' '}
                <input
                  type="file"
                  multiple
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
      <button disabled={faltan > 0} onClick={descargar}>
        Descargar ZIP
      </button>
      {faltan > 0 && <p>Falta archivo en {faltan} tarea(s) obligatoria(s).</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  )
}
