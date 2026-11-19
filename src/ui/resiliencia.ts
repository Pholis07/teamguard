import { confirmProposal, proposeCoverage, type RuleContext, type Task } from '../domain'
import { equilibrio } from './equilibrio'

/**
 * Prueba de resiliencia: para cada integrante, ¿qué pasa si falta desde hoy hasta la última entrega?
 * Mide el equilibrio sin cubrir y después de aplicar, una a una, las propuestas de TeamGuard.
 * Solo calcula: no cambia el estado.
 */
export function resiliencia(contexto: RuleContext) {
  const abiertas = contexto.tasks.filter((t) => t.status !== 'done')
  const hasta = abiertas.reduce((max, t) => (t.dueDate > max ? t.dueDate : max), contexto.asOf)
  return contexto.members.map((m) => {
    const ctx: RuleContext = { ...contexto, absences: [...contexto.absences, { memberId: m.id, from: contexto.asOf, to: hasta, status: 'active' }] }
    const sinCobertura = equilibrio(ctx)
    let tasks = ctx.tasks
    const cubre: { tarea: string; quien: string }[] = []
    const imposibles: Task[] = []
    for (const t of sinCobertura.sinCubrir) {
      const { proposal } = proposeCoverage({ ...ctx, tasks }, t.id)
      if (!proposal) { imposibles.push(t); continue }
      tasks = confirmProposal({ ...ctx, tasks }, proposal)
      cubre.push({ tarea: t.title, quien: proposal.candidateId })
    }
    return {
      memberId: m.id,
      sinCobertura: sinCobertura.indice,
      conCobertura: equilibrio({ ...ctx, tasks }).indice,
      cubre,
      imposibles,
      afectaTareas: sinCobertura.sinCubrir.length > 0,
    }
  })
}
