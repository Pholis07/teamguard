import { confirmProposal, createDemoState, DEMO_DATE, type Absence, type CoverageProposal, type Member, type RuleContext, type Task } from '../domain'
import type { Entrega } from '../delivery/zip'
import { fechaValida, horasValidas, nombreValido, type Proyecto } from './formato'

/* Estado compartido. Las cargas no se guardan: se calculan a partir de aquí. */
export type Estado = {
  fase: 'inicio' | 'app'
  proyecto: Proyecto | null
  members: Member[]
  tasks: Task[]
  absence: Absence | null
  files: Entrega[]
}

export type NuevaTarea = {
  title: string
  ownerId: string
  estimatedHours: number
  dueDate: string
  status: Task['status']
  requiresFile?: boolean
}

// Simular, editar y rechazar no pasan por aquí: solo aceptar cambia ownerId.
export type Accion =
  | { type: 'iniciar'; nombre: string }
  | { type: 'cargarEjemplo' }
  | { type: 'salir' }
  | { type: 'addMember'; name: string; availableHours: number }
  | { type: 'updateMember'; id: string; cambios: Partial<Omit<Member, 'id'>> }
  | { type: 'removeMember'; id: string }
  | ({ type: 'addTask' } & NuevaTarea)
  | { type: 'updateTask'; id: string; cambios: Partial<Omit<Task, 'id'>> }
  | { type: 'removeTask'; id: string }
  | { type: 'acceptProposal'; proposal: CoverageProposal }
  | { type: 'setAbsence'; absence: Absence | null }
  | { type: 'addFile'; entrega: Entrega }
  | { type: 'reset' }

export const estadoInicial = (): Estado => ({ fase: 'inicio', proyecto: null, members: [], tasks: [], absence: null, files: [] })

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

const tareaValida = (t: Task, members: readonly Member[]) =>
  nombreValido(t.title) && horasValidas(t.estimatedHours) && fechaValida(t.dueDate) && members.some((m) => m.id === t.ownerId)

export function reducer(estado: Estado, accion: Accion): Estado {
  switch (accion.type) {
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
    case 'removeTask':
      return { ...estado, tasks: estado.tasks.filter((t) => t.id !== accion.id), files: estado.files.filter((f) => f.taskId !== accion.id) }
    case 'acceptProposal':
      try {
        return { ...estado, tasks: confirmProposal(contextoDe(estado), accion.proposal) }
      } catch (error) {
        // Propuesta obsoleta (p. ej. doble clic en Aceptar): se ignora en vez de tumbar la app.
        console.warn(error)
        return estado
      }
    case 'setAbsence':
      return { ...estado, absence: accion.absence }
    case 'addFile':
      return { ...estado, files: [...estado.files, accion.entrega] }
    case 'reset':
      return estadoInicial()
  }
}
