import { calculateLoads, getTasksNeedingCoverage, type RuleContext } from '../domain'

/**
 * Índice de equilibrio: % de las horas abiertas que caben en el tiempo real de su responsable.
 * No caben las horas de más de alguien sobrecargado ni las tareas de un ausente que nadie cubre.
 * Es la única fuente del riesgo y del estado del equipo: Bajo = 100, Medio = 80–99, Alto < 80.
 */
export function equilibrio(contexto: RuleContext) {
  const sinCubrir = getTasksNeedingCoverage(contexto)
  const idsSinCubrir = new Set(sinCubrir.map((t) => t.id))
  const total = contexto.tasks.filter((t) => t.status !== 'done').reduce((s, t) => s + t.estimatedHours, 0)
  // Las tareas sin cubrir ya cuentan completas como «no caben»: se quitan de la carga para no contarlas dos veces.
  const cargas = calculateLoads(contexto.members, contexto.tasks.filter((t) => !idsSinCubrir.has(t.id)))
  const sobrecargados = cargas.filter((c) => c.assignedHours > c.availableHours).map((c) => c.memberId)
  const deMas = cargas.reduce((s, c) => s + Math.max(0, c.assignedHours - c.availableHours), 0)
  const caben = total - sinCubrir.reduce((s, t) => s + t.estimatedHours, 0) - deMas
  const indice = total === 0 ? 100 : Math.round((caben / total) * 100)
  const riesgo = indice === 100 ? 'Bajo' : indice >= 80 ? 'Medio' : 'Alto'
  return { indice, caben, total, riesgo, sinCubrir, sobrecargados } as const
}
