import { confirmProposal, createDemoState, DEMO_DATE, type Absence, type CoverageProposal, type Member, type RuleContext, type Task } from '../domain'
import type { Entrega } from '../delivery/zip'
import type { Decision } from '../delivery/acta'
import { equilibrio } from './equilibrio'
import { fechaValida, horasValidas, nombreValido, rango, type Proyecto } from './formato'

/* Estado compartido. Las cargas no se guardan: se calculan a partir de aquí. */
export type Estado = {
  fase: 'inicio' | 'app'
  proyecto: Proyecto | null
  members: Member[]
  tasks: Task[]
  absence: Absence | null
  files: Entrega[]
  /** Bitácora para el acta del ZIP. */
  decisiones: Decision[]
}

export type NuevaTarea = {
  title: string
  ownerId: string
  estimatedHours: number
  dueDate: string
  status: Task['status']
  requiresFile?: boolean
}

// `hora` la pone quien despacha, para que el reducer siga siendo puro.
// Simular, editar y rechazar no pasan por aquí: solo aceptar cambia ownerId.
export type Accion =
  | { type: 'entrar' }
  | { type: 'iniciar'; nombre: string }
  | { type: 'cargarEjemplo' }
  | { type: 'salir' }
  | { type: 'addMember'; name: string; availableHours: number }
  | { type: 'updateMember'; id: string; cambios: Partial<Omit<Member, 'id'>> }
  | { type: 'removeMember'; id: string }
  | ({ type: 'addTask' } & NuevaTarea)
  | { type: 'updateTask'; id: string; cambios: Partial<Omit<Task, 'id' | 'ownerId'>> }
  // Cambio manual de responsable: siempre queda en la bitácora (y en el acta).
  | { type: 'reassignTask'; id: string; ownerId: string; hora: string }
  | { type: 'removeTask'; id: string }
  | { type: 'acceptProposal'; proposal: CoverageProposal; hora: string }
  | { type: 'setAbsence'; absence: Absence | null; hora: string }
  | { type: 'addFile'; entrega: Entrega }
  | { type: 'reset' }

export const estadoInicial = (): Estado => ({ fase: 'inicio', proyecto: null, members: [], tasks: [], absence: null, files: [], decisiones: [] })

export const contextoDe = (estado: Estado): RuleContext => ({
  members: estado.members,
  tasks: estado.tasks,
  absences: estado.absence ? [estado.absence] : [],
  asOf: DEMO_DATE,
})

/** Siguiente id «<prefijo>-<n>» que no choca con los existentes. */
function siguienteId(prefijo: string, ids: readonly string[]) {
  const n = ids.reduce((max, id) => Math.max(max, Number(/(\d+)$/.exec(id)?.[1] ?? 0)), 0)
  return `${prefijo}-${n + 1}`
}

const nombreDe = (estado: Estado, id: string) => estado.members.find((m) => m.id === id)?.name ?? id
/** Aplica un cambio y lo anota en la bitácora con el equilibrio de antes y de después. */
const anotar = (antes: Estado, despues: Estado, hora: string, texto: string): Estado => {
  const decision: Decision = {
    hora,
    texto,
    equilibrio: { antes: equilibrio(contextoDe(antes)).indice, despues: equilibrio(contextoDe(despues)).indice },
  }
  return { ...despues, decisiones: [...antes.decisiones, decision] }
}

const tareaValida = (t: Task, members: readonly Member[]) =>
  nombreValido(t.title) && horasValidas(t.estimatedHours) && fechaValida(t.dueDate) && members.some((m) => m.id === t.ownerId)

export function reducer(estado: Estado, accion: Accion): Estado {
  switch (accion.type) {
    case 'entrar':
      return { ...estadoInicial(), fase: 'app', proyecto: null }
    case 'iniciar':
      if (!nombreValido(accion.nombre)) return estado
      return { ...estadoInicial(), fase: 'app', proyecto: { nombre: accion.nombre.trim(), ejemplo: false } }
    case 'cargarEjemplo':
      return { ...estadoInicial(), ...createDemoState(), fase: 'app', proyecto: { nombre: 'Proyecto final (ejemplo)', ejemplo: true } }
    case 'salir':
      return { ...estado, fase: 'inicio' }
    case 'addMember': {
      if (!nombreValido(accion.name) || !horasValidas(accion.availableHours)) return estado
      const member = { id: siguienteId('m', estado.members.map((m) => m.id)), name: accion.name.trim(), availableHours: accion.availableHours }
      return { ...estado, members: [...estado.members, member] }
    }
    case 'updateMember': {
      const actual = estado.members.find((m) => m.id === accion.id)
      if (!actual) return estado
      const nuevo = { ...actual, ...accion.cambios, id: actual.id }
      if (!nombreValido(nuevo.name) || !horasValidas(nuevo.availableHours)) return estado
      return { ...estado, members: estado.members.map((m) => (m.id === actual.id ? nuevo : m)) }
    }
    case 'removeMember': {
      if (estado.tasks.some((t) => t.ownerId === accion.id)) return estado
      return {
        ...estado,
        members: estado.members.filter((m) => m.id !== accion.id),
        absence: estado.absence?.memberId === accion.id ? null : estado.absence,
      }
    }
    case 'addTask': {
      const { type: _tipo, ...datos } = accion
      const tarea: Task = { ...datos, id: siguienteId('t', estado.tasks.map((t) => t.id)), title: datos.title.trim(), requiresFile: datos.requiresFile ?? true }
      if (!tareaValida(tarea, estado.members)) return estado
      return { ...estado, tasks: [...estado.tasks, tarea] }
    }
    case 'updateTask': {
      const actual = estado.tasks.find((t) => t.id === accion.id)
      if (!actual) return estado
      const nueva = { ...actual, ...accion.cambios, id: actual.id }
      if (!tareaValida(nueva, estado.members)) return estado
      return { ...estado, tasks: estado.tasks.map((t) => (t.id === actual.id ? nueva : t)) }
    }
    case 'reassignTask': {
      const actual = estado.tasks.find((t) => t.id === accion.id)
      if (!actual || actual.ownerId === accion.ownerId || !estado.members.some((m) => m.id === accion.ownerId)) return estado
      const texto = `${actual.title} pasó de ${nombreDe(estado, actual.ownerId)} a ${nombreDe(estado, accion.ownerId)} (cambio manual)`
      const tasks = estado.tasks.map((t) => (t.id === actual.id ? { ...t, ownerId: accion.ownerId } : t))
      return anotar(estado, { ...estado, tasks }, accion.hora, texto)
    }
    case 'removeTask':
      // Una tarea con archivos entregados no se borra: se perdería trabajo real del equipo.
      if (estado.files.some((f) => f.taskId === accion.id)) return estado
      return { ...estado, tasks: estado.tasks.filter((t) => t.id !== accion.id) }
    case 'acceptProposal': {
      const { proposal, hora } = accion
      try {
        const tasks = confirmProposal(contextoDe(estado), proposal)
        const titulo = tasks.find((t) => t.id === proposal.taskId)?.title ?? proposal.taskId
        const texto = `${titulo} pasó de ${nombreDe(estado, proposal.currentOwnerId)} a ${nombreDe(estado, proposal.candidateId)} (cobertura aceptada)`
        return anotar(estado, { ...estado, tasks }, hora, texto)
      } catch (error) {
        // Propuesta obsoleta (p. ej. doble clic en Aceptar): se ignora en vez de tumbar la app.
        console.warn(error)
        return estado
      }
    }
    case 'setAbsence': {
      const { absence, hora } = accion
      // Solo fechas: el motivo de una ausencia nunca se registra.
      const texto = absence
        ? `Se registró la ausencia de ${nombreDe(estado, absence.memberId)} del ${rango(absence.from, absence.to)}`
        : estado.absence && `Se retiró la ausencia de ${nombreDe(estado, estado.absence.memberId)}`
      const nuevo = { ...estado, absence }
      return texto ? anotar(estado, nuevo, hora, texto) : nuevo
    }
    case 'addFile':
      return { ...estado, files: [...estado.files, accion.entrega] }
    case 'reset':
      return estadoInicial()
  }
}
