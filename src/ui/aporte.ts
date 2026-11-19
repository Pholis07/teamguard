import type { Member, Task } from '../domain'
import type { Entrega } from '../delivery/zip'

export type AporteMiembro = {
  memberId: string
  name: string
  hecho: number
  enProgreso: number
  pendiente: number
  horas: number
  tareas: number
  archivos: number
  /** Porcentaje entero de las horas del proyecto; los porcentajes suman 100 si hay horas. */
  pct: number
}

export type Aporte = { miembros: AporteMiembro[]; total: number }

/** Reparto de horas por integrante y estado. No calcula riesgo (eso es de `equilibrio()`). */
export function aporte(members: readonly Member[], tasks: readonly Task[], files: readonly Entrega[]): Aporte {
  const filas = members.map((m) => {
    const suyas = tasks.filter((t) => t.ownerId === m.id)
    const suma = (s: Task['status']) => suyas.filter((t) => t.status === s).reduce((a, t) => a + t.estimatedHours, 0)
    const hecho = suma('done'), enProgreso = suma('active'), pendiente = suma('pending')
    return {
      memberId: m.id, name: m.name, hecho, enProgreso, pendiente,
      horas: hecho + enProgreso + pendiente,
      tareas: suyas.length,
      archivos: files.filter((f) => f.uploaderId === m.id).length,
      pct: 0,
    }
  })
  const total = filas.reduce((s, f) => s + f.horas, 0)
  if (total > 0) {
    // Mayor resto: parte entera y los puntos que faltan para 100 van a los mayores restos.
    const exactos = filas.map((f) => (f.horas * 100) / total)
    const pisos = exactos.map(Math.floor)
    let faltan = 100 - pisos.reduce((a, b) => a + b, 0)
    const orden = exactos.map((e, i) => ({ i, resto: e - pisos[i] })).sort((a, b) => b.resto - a.resto || a.i - b.i)
    for (const { i } of orden) { if (faltan-- > 0) pisos[i]++ }
    filas.forEach((f, i) => { f.pct = pisos[i] })
  }
  return { miembros: filas, total }
}
