import { calculateLoads } from './rules'
import type { Absence, Member, RuleContext, Task } from './types'

/**
 * Motor de rescate: dependencias, calendario estimado y plan de recuperación. Determinista y sin IA.
 *
 * Supuesto de calendario (se muestra en la interfaz): las horas disponibles de cada integrante se
 * reparten por igual entre los días hábiles (lunes a viernes) desde `asOf` hasta la entrega general
 * (la fecha límite más tardía). Una tarea puede empezar el día después de que terminen sus dependencias.
 * Las estimaciones no son garantías.
 */

/** El responsable de `taskId` no avanza en ella antes de `hasta` (atraso simulado o registrado). */
export type Incidente = { taskId: string; ownerId: string; hasta: string }

export type ProposedChange = { taskId: string; fromMemberId: string; toMemberId: string; motivo: string }

export interface RescueScenario {
  scenarioId: 'sin-intervenir' | 'plan-rescate'
  /** Fecha estimada en que termina todo; null si no se puede estimar o no termina. */
  estimatedCompletion: string | null
  /** Entrega general: la fecha límite más tardía de las tareas abiertas. */
  deadline: string
  /** Fecha estimada de término por tarea abierta (null = no termina en el horizonte). */
  taskFinish: Record<string, string | null>
  lateTaskIds: string[]
  /** Tareas cuyo avance depende (directa o indirectamente) de una tarea atrasada o tardía. */
  blockedTaskIds: string[]
  overloadedMemberIds: string[]
  proposedChanges: ProposedChange[]
  /** Tareas resultantes del escenario (para comparar responsables y cargas). */
  tasks: Task[]
  warnings: string[]
  /** false si faltan estimaciones o hay dependencias circulares: la fecha no es confiable. */
  datosCompletos: boolean
  feasible: boolean
}

const HORIZONTE = 120 // días naturales simulados como máximo
const EPS = 1e-9

export const sumarDias = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
const esHabil = (iso: string) => ![0, 6].includes(new Date(`${iso}T00:00:00Z`).getUTCDay())

/** Fecha a `n` días hábiles después de `iso` (n = 0 → el mismo día). */
export function sumarHabiles(iso: string, n: number) {
  let d = iso
  for (let k = 0; k < n; ) { d = sumarDias(d, 1); if (esHabil(d)) k++ }
  return d
}

/** Primera dependencia circular encontrada como ruta de ids (A → B → A), o null. */
export function cicloDe(tasks: readonly Task[]): string[] | null {
  const porId = new Map(tasks.map((t) => [t.id, t]))
  const estado = new Map<string, 'visitando' | 'listo'>()
  const ruta: string[] = []
  const visitar = (id: string): string[] | null => {
    if (estado.get(id) === 'listo') return null
    if (estado.get(id) === 'visitando') return [...ruta.slice(ruta.indexOf(id)), id]
    estado.set(id, 'visitando'); ruta.push(id)
    for (const dep of porId.get(id)?.dependsOn ?? []) {
      if (!porId.has(dep)) continue
      const ciclo = visitar(dep)
      if (ciclo) return ciclo
    }
    ruta.pop(); estado.set(id, 'listo')
    return null
  }
  for (const t of tasks) { const c = visitar(t.id); if (c) return c }
  return null
}

/** Ids de las tareas que dependen, directa o indirectamente, de `taskId`. */
export function dependientes(tasks: readonly Task[], taskId: string): string[] {
  const res = new Set<string>()
  const pendientes = [taskId]
  while (pendientes.length) {
    const actual = pendientes.pop()!
    for (const t of tasks) if (t.dependsOn?.includes(actual) && !res.has(t.id)) { res.add(t.id); pendientes.push(t.id) }
  }
  return [...res]
}

const ausente = (absences: readonly Absence[], memberId: string, dia: string) =>
  absences.some((a) => a.status === 'active' && a.memberId === memberId && a.from <= dia && a.to >= dia)

/** Simula día por día y devuelve el escenario (sin cambios propuestos). */
function programar(contexto: RuleContext, tasks: Task[], incidente: Incidente | undefined, scenarioId: RescueScenario['scenarioId']): RescueScenario {
  const { members, absences, asOf } = contexto
  const warnings: string[] = []
  const abiertas = tasks.filter((t) => t.status !== 'done')
  const deadline = abiertas.reduce((max, t) => (t.dueDate > max ? t.dueDate : max), asOf)
  const porId = new Map(tasks.map((t) => [t.id, t]))

  const sinEstimar = abiertas.filter((t) => t.estimatedHours <= 0)
  if (sinEstimar.length) warnings.push(`Falta estimar las horas de: ${sinEstimar.map((t) => t.title).join(', ')}. No se puede calcular una fecha confiable.`)
  const ciclo = cicloDe(tasks)
  if (ciclo) warnings.push(`Dependencias circulares: ${ciclo.map((id) => porId.get(id)?.title ?? id).join(' → ')}.`)
  const desconocidas = abiertas.flatMap((t) => (t.dependsOn ?? []).filter((d) => !porId.has(d)))
  if (desconocidas.length) warnings.push(`Se ignoran dependencias a tareas que no existen (${desconocidas.join(', ')}).`)

  let habiles = 0
  for (let d = asOf; d <= deadline; d = sumarDias(d, 1)) if (esHabil(d)) habiles++
  const porDia = new Map(members.map((m) => [m.id, m.availableHours / Math.max(1, habiles)]))

  const restante = new Map(abiertas.map((t) => [t.id, t.estimatedHours]))
  const fin = new Map<string, string>()
  // shortcut: una tarea empieza el día después de que terminan sus dependencias (sin fracciones de día); basta para el prototipo.
  const lista = (t: Task, dia: string) =>
    (t.dependsOn ?? []).every((d) => { const dep = porId.get(d); return !dep || dep.status === 'done' || (fin.has(d) && fin.get(d)! < dia) })

  for (let i = 0, dia = asOf; i < HORIZONTE && fin.size < abiertas.length; i++, dia = sumarDias(dia, 1)) {
    if (!esHabil(dia)) continue
    for (const m of members) {
      if (ausente(absences, m.id, dia)) continue
      let horas = porDia.get(m.id) ?? 0
      const listas = abiertas
        .filter((t) => t.ownerId === m.id && !fin.has(t.id) && lista(t, dia))
        .filter((t) => !(incidente && t.id === incidente.taskId && t.ownerId === incidente.ownerId && dia < incidente.hasta))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id))
      for (const t of listas) {
        if (horas <= EPS) break
        const h = Math.min(horas, restante.get(t.id)!)
        restante.set(t.id, restante.get(t.id)! - h)
        horas -= h
        if (restante.get(t.id)! <= EPS) fin.set(t.id, dia)
      }
    }
  }

  const taskFinish = Object.fromEntries(abiertas.map((t) => [t.id, fin.get(t.id) ?? null]))
  const sinTerminar = abiertas.filter((t) => !fin.has(t.id))
  if (sinTerminar.length && !sinEstimar.length && !ciclo) {
    warnings.push(`Con la capacidad registrada no se termina: ${sinTerminar.map((t) => t.title).join(', ')}.`)
  }
  const lateTaskIds = abiertas.filter((t) => !fin.has(t.id) || fin.get(t.id)! > t.dueDate).map((t) => t.id)
  const problemas = new Set([...lateTaskIds, ...(incidente ? [incidente.taskId] : [])])
  const blockedTaskIds = abiertas.filter((t) => [...problemas].some((p) => dependientes(tasks, p).includes(t.id))).map((t) => t.id)
  const overloadedMemberIds = calculateLoads(members, tasks).filter((c) => c.status === 'overloaded').map((c) => c.memberId)
  const estimable = !sinEstimar.length && !ciclo && !sinTerminar.length
  const estimatedCompletion = estimable ? abiertas.reduce((max, t) => (fin.get(t.id)! > max ? fin.get(t.id)! : max), asOf) : null

  return {
    scenarioId, estimatedCompletion, deadline, taskFinish, lateTaskIds, blockedTaskIds, overloadedMemberIds,
    proposedChanges: [], tasks, warnings,
    datosCompletos: !sinEstimar.length && !ciclo,
    feasible: estimatedCompletion !== null && estimatedCompletion <= deadline && overloadedMemberIds.length === 0,
  }
}

/** Candidatos para recibir una tarea: sin ausencia hasta su fecha, con la habilidad si se pide, más horas libres primero. */
function candidatos(contexto: RuleContext, tasks: readonly Task[], tarea: Task): Member[] {
  const cargas = calculateLoads(contexto.members, tasks)
  const libres = (id: string) => { const c = cargas.find((x) => x.memberId === id)!; return c.availableHours - c.assignedHours }
  return contexto.members
    .filter((m) => m.id !== tarea.ownerId && m.availableHours > 0)
    .filter((m) => !contexto.absences.some((a) => a.status === 'active' && a.memberId === m.id && a.from <= tarea.dueDate && a.to >= contexto.asOf))
    .filter((m) => !tarea.skill || !m.skills || m.skills.includes(tarea.skill))
    .sort((a, b) => libres(b.id) - libres(a.id) || a.id.localeCompare(b.id))
}

/**
 * Compara «no intervenir» con un plan de rescate. No modifica nada: las tareas recibidas quedan intactas
 * y cada cambio propuesto debe aceptarse aparte. Una reasignación entra al plan solo si reduce las tareas
 * tardías sin sobrecargar a quien la recibe; si ninguna lo logra, el plan lo dice en lugar de inventar.
 */
export function analizarRescate(contexto: RuleContext, incidente?: Incidente): { sinIntervenir: RescueScenario; plan: RescueScenario } {
  const sinIntervenir = programar(contexto, contexto.tasks.map((t) => ({ ...t })), incidente, 'sin-intervenir')
  let tasks = contexto.tasks.map((t) => ({ ...t }))
  let actual = sinIntervenir
  const cambios: ProposedChange[] = []

  for (let mejoro = sinIntervenir.datosCompletos; mejoro && actual.lateTaskIds.length > 0; ) {
    mejoro = false
    // Primero la tarea atrasada (suele ser la raíz), luego las tardías por orden de fecha.
    for (const id of new Set([...(incidente ? [incidente.taskId] : []), ...actual.lateTaskIds])) {
      const tarea = tasks.find((t) => t.id === id)
      if (!tarea || tarea.status === 'done') continue
      for (const m of candidatos(contexto, tasks, tarea)) {
        const prueba = tasks.map((t) => (t.id === tarea.id ? { ...t, ownerId: m.id } : t))
        const r = programar(contexto, prueba, incidente, 'plan-rescate')
        if (r.lateTaskIds.length < actual.lateTaskIds.length && !r.overloadedMemberIds.includes(m.id)) {
          const motivo = incidente?.taskId === tarea.id ? 'Se atrasa con su responsable actual'
            : actual.blockedTaskIds.includes(tarea.id) ? 'Está bloqueada por otra tarea' : 'Termina después de su fecha límite'
          cambios.push({ taskId: tarea.id, fromMemberId: tarea.ownerId, toMemberId: m.id, motivo })
          tasks = prueba; actual = r; mejoro = true
          break
        }
      }
      if (mejoro) break
    }
  }

  const plan: RescueScenario = { ...programar(contexto, tasks, incidente, 'plan-rescate'), proposedChanges: cambios }
  if (plan.datosCompletos && !plan.feasible) plan.warnings.push('Ninguna redistribución disponible permite entregar a tiempo sin sobrecargar a alguien.')
  return { sinIntervenir, plan }
}
