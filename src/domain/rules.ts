import type {
  Absence, AssignmentSimulation, CoverageProposal, Member, MemberLoad,
  ProposalResult, RuleContext, Task,
} from './types'

function validateHours(value: number) {
  if (!Number.isFinite(value) || value < 0) throw new Error('Las horas deben ser finitas y no negativas.')
}

function validateDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error('Usa fechas válidas con formato YYYY-MM-DD.')
  }
}

function validateData(members: readonly Member[], tasks: readonly Task[]) {
  const ids = new Set(members.map((member) => member.id))
  if (ids.size !== members.length || new Set(tasks.map((task) => task.id)).size !== tasks.length) {
    throw new Error('Los identificadores deben ser únicos.')
  }
  members.forEach((member) => validateHours(member.availableHours))
  tasks.forEach((task) => {
    validateHours(task.estimatedHours)
    validateDate(task.dueDate)
    if (!ids.has(task.ownerId)) throw new Error('El responsable de la tarea no existe.')
  })
}

function validateContext(context: RuleContext) {
  validateData(context.members, context.tasks)
  validateDate(context.asOf)
  context.absences.forEach((absence) => {
    validateDate(absence.from)
    validateDate(absence.to)
    if (absence.from > absence.to) throw new Error('El inicio de ausencia debe ser anterior al fin.')
    if (!context.members.some((member) => member.id === absence.memberId)) throw new Error('El integrante ausente no existe.')
  })
}

export function calculateLoads(members: readonly Member[], tasks: readonly Task[]): MemberLoad[] {
  validateData(members, tasks)
  return members.map((member) => {
    const assignedHours = tasks.filter((task) => task.ownerId === member.id && task.status !== 'done')
      .reduce((total, task) => total + task.estimatedHours, 0)
    const ratio = member.availableHours === 0 ? null : assignedHours / member.availableHours
    return {
      memberId: member.id, assignedHours, availableHours: member.availableHours,
      remainingHours: Math.max(0, member.availableHours - assignedHours),
      ratio, percentage: ratio === null ? null : ratio * 100,
      status: ratio === null ? 'no-capacity' : ratio > 1 ? 'overloaded' : 'normal',
    }
  })
}

/** Incluye tareas vencidas sin terminar. */
export function isTaskOverdue(task: Task, asOf: string): boolean {
  validateDate(task.dueDate)
  validateDate(asOf)
  return task.status !== 'done' && task.dueDate < asOf
}

/** Simula incluso una sobrecarga, pero nunca modifica las tareas recibidas. */
export function simulateAssignment(
  members: readonly Member[], tasks: readonly Task[], taskId: string, candidateId: string,
): AssignmentSimulation {
  validateData(members, tasks)
  const task = tasks.find((item) => item.id === taskId)
  if (!task) throw new Error('La tarea no existe.')
  if (task.status === 'done') throw new Error('Una tarea terminada no se reasigna.')
  if (!members.some((member) => member.id === candidateId)) throw new Error('El candidato no existe.')
  return {
    taskId, currentOwnerId: task.ownerId, candidateId,
    currentLoads: calculateLoads(members, tasks),
    projectedLoads: calculateLoads(members, tasks.map((item) => item.id === taskId ? { ...item, ownerId: candidateId } : item)),
  }
}

function overlaps(absence: Absence, from: string, to: string) {
  return absence.status === 'active' && absence.from <= to && absence.to >= from
}

function needsCoverage(task: Task, context: RuleContext) {
  // Una tarea vencida sigue pendiente hoy; una futura se cubre si vence en la ausencia.
  const executionDate = task.dueDate < context.asOf ? context.asOf : task.dueDate
  return task.status !== 'done' && context.absences.some((absence) =>
    absence.memberId === task.ownerId && overlaps(absence, executionDate, executionDate),
  )
}

export function getTasksNeedingCoverage(context: RuleContext): Task[] {
  validateContext(context)
  return context.tasks.filter((task) => needsCoverage(task, context)).map((task) => ({ ...task }))
}

export function getCoverageCandidates(context: RuleContext, taskId: string): Member[] {
  validateContext(context)
  const task = context.tasks.find((item) => item.id === taskId)
  if (!task || !needsCoverage(task, context)) return []
  const until = task.dueDate < context.asOf ? context.asOf : task.dueDate
  const loads = calculateLoads(context.members, context.tasks)
  return context.members.filter((member) => {
    const load = loads.find((item) => item.memberId === member.id)!
    return member.id !== task.ownerId && member.availableHours > 0 &&
      load.remainingHours >= task.estimatedHours &&
      !context.absences.some((absence) => absence.memberId === member.id && overlaps(absence, context.asOf, until))
  }).sort((a, b) => {
    const aLoad = loads.find((load) => load.memberId === a.id)!
    const bLoad = loads.find((load) => load.memberId === b.id)!
    return bLoad.remainingHours - aLoad.remainingHours || a.id.localeCompare(b.id)
  }).map((member) => ({ ...member }))
}

/** candidateId permite editar una propuesta usando exactamente las mismas reglas. */
export function proposeCoverage(context: RuleContext, taskId: string, candidateId?: string): ProposalResult {
  validateContext(context)
  const task = context.tasks.find((item) => item.id === taskId)
  if (!task) return { proposal: null, reason: 'La tarea no existe.' }
  if (!needsCoverage(task, context)) return { proposal: null, reason: 'La tarea no necesita cobertura por ausencia.' }
  const candidates = getCoverageCandidates(context, taskId)
  const candidate = candidateId === undefined ? candidates[0] : candidates.find((member) => member.id === candidateId)
  if (!candidate) return { proposal: null, reason: candidateId === undefined
    ? 'No hay integrantes disponibles con horas suficientes.'
    : 'El candidato no está disponible o no tiene horas suficientes.' }
  return { proposal: simulateAssignment(context.members, context.tasks, taskId, candidate.id), reason: null }
}

/** Revalida contra el estado actual para impedir aceptar una propuesta obsoleta. */
export function confirmProposal(context: RuleContext, proposal: CoverageProposal): Task[] {
  const task = context.tasks.find((item) => item.id === proposal.taskId)
  if (!task || task.ownerId !== proposal.currentOwnerId) throw new Error('La propuesta ya no corresponde al responsable actual.')
  const refreshed = proposeCoverage(context, proposal.taskId, proposal.candidateId)
  if (!refreshed.proposal) throw new Error(refreshed.reason)
  return context.tasks.map((item) => item.id === proposal.taskId ? { ...item, ownerId: proposal.candidateId } : { ...item })
}

/** El consumidor descarta su propuesta local; no se toca el estado compartido. */
export function rejectProposal(): null {
  return null
}
