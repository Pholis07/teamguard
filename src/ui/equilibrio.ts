import { calculateLoads, getTasksNeedingCoverage, type RuleContext } from '../domain'

/**
 * Índice de equilibrio: % de las horas abiertas que caben en el tiempo real de su responsable.
 * No caben las horas de más de alguien sobrecargado ni las tareas de un ausente que nadie cubre.
 */
export function equilibrio(contexto: RuleContext) {
  const sinCubrir = getTasksNeedingCoverage(contexto)
  const idsSinCubrir = new Set(sinCubrir.map((t) => t.id))
  const total = contexto.tasks.filter((t) => t.status !== 'done').reduce((s, t) => s + t.estimatedHours, 0)
  // Las tareas sin cubrir ya cuentan completas como «no caben»: se quitan de la carga para no contarlas dos veces.
  const deMas = calculateLoads(contexto.members, contexto.tasks.filter((t) => !idsSinCubrir.has(t.id)))
    .reduce((s, c) => s + Math.max(0, c.assignedHours - c.availableHours), 0)
  const noCaben = sinCubrir.reduce((s, t) => s + t.estimatedHours, 0) + deMas
  const caben = total - noCaben
  return { indice: total === 0 ? 100 : Math.round((caben / total) * 100), caben, total }
}
