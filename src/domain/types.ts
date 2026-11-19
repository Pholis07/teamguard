export type Member = {
  id: string
  name: string
  availableHours: number
  /** Habilidades declaradas (opcional): las usa el plan de rescate. */
  skills?: string[]
}

export type Task = {
  id: string
  title: string
  ownerId: string
  estimatedHours: number
  status: 'pending' | 'active' | 'done'
  /** Fecha de calendario YYYY-MM-DD. */
  dueDate: string
  requiresFile: boolean
  /** Ids de las tareas que deben terminar antes (opcional). */
  dependsOn?: string[]
  /** Habilidad que requiere (opcional). */
  skill?: string
}

export type Absence = {
  memberId: string
  from: string
  to: string
  status: 'active' | 'cancelled'
}

export type MemberLoad = {
  memberId: string
  assignedHours: number
  availableHours: number
  remainingHours: number
  /** null cuando no hay capacidad; nunca Infinity ni NaN. */
  ratio: number | null
  percentage: number | null
  status: 'normal' | 'overloaded' | 'no-capacity'
}

export type AssignmentSimulation = {
  taskId: string
  currentOwnerId: string
  candidateId: string
  currentLoads: MemberLoad[]
  projectedLoads: MemberLoad[]
}

export type CoverageProposal = AssignmentSimulation
export type ProposalResult =
  | { proposal: CoverageProposal; reason: null }
  | { proposal: null; reason: string }

export type RuleContext = {
  members: readonly Member[]
  tasks: readonly Task[]
  absences: readonly Absence[]
  /** Día de referencia explícito para que la demo sea reproducible. */
  asOf: string
}
