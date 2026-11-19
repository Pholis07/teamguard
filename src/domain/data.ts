import type { Absence, Member, Task } from './types'

export const DEMO_DATE = '2026-11-19'

export const DEMO_MEMBERS: readonly Member[] = [
  { id: 'm1', name: 'Ana', availableHours: 4 },
  { id: 'm2', name: 'Luis', availableHours: 6 },
  { id: 'm3', name: 'Sol', availableHours: 4 },
]

export const DEMO_TASKS: readonly Task[] = [
  { id: 't1', title: 'Boceto', ownerId: 'm1', estimatedHours: 3, status: 'active', dueDate: '2026-11-20', requiresFile: true },
  { id: 't2', title: 'Ficha', ownerId: 'm2', estimatedHours: 2, status: 'active', dueDate: '2026-11-20', requiresFile: true },
  { id: 't3', title: 'Resumen', ownerId: 'm3', estimatedHours: 2, status: 'active', dueDate: '2026-11-20', requiresFile: true },
]

export const DEMO_ABSENCE: Absence = {
  memberId: 'm1', from: '2026-11-19', to: '2026-11-21', status: 'active',
}

/** Copias nuevas para cada inicio o reinicio del estado compartido. */
export function createDemoState() {
  return {
    members: DEMO_MEMBERS.map((member) => ({ ...member })),
    tasks: DEMO_TASKS.map((task) => ({ ...task })),
    absence: null as Absence | null,
  }
}

export const DEMO_EXPECTED = {
  initialAna: { assignedHours: 3, availableHours: 4, percentage: 75 },
  simulatedAna: { assignedHours: 5, availableHours: 4, percentage: 125 },
  coveredLuis: { assignedHours: 5, availableHours: 6, ratio: 5 / 6 },
  coverage: { taskId: 't1', currentOwnerId: 'm1', candidateId: 'm2' },
} as const
