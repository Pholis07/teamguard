import JSZip from 'jszip'
import type { Member, Task } from '../domain'

/** Un archivo ligado a su tarea y a quien lo subió (la autoría no cambia al reasignar). */
export type Entrega = { taskId: string; uploaderId: string; file: File }

/** Tareas obligatorias con al menos un archivo: habilita la descarga cuando listas === total. */
export function progresoEntrega(tasks: readonly Task[], entregas: readonly Entrega[]) {
  const obligatorias = tasks.filter((t) => t.requiresFile)
  const listas = obligatorias.filter((t) => entregas.some((e) => e.taskId === t.id)).length
  return { listas, total: obligatorias.length }
}

function conSufijo(nombre: string, n: number) {
  const punto = nombre.lastIndexOf('.')
  return punto > 0 ? `${nombre.slice(0, punto)} (${n})${nombre.slice(punto)}` : `${nombre} (${n})`
}

/** Ruta por tarea y autor; un nombre repetido en la misma ruta recibe sufijo " (2)", " (3)"… */
export function rutasZip(entregas: readonly Entrega[], tasks: readonly Task[], members: readonly Member[]) {
  const usadas = new Set<string>()
  return entregas.map(({ taskId, uploaderId, file }) => {
    const tarea = tasks.find((t) => t.id === taskId)?.title ?? taskId
    const autor = members.find((m) => m.id === uploaderId)?.name ?? uploaderId
    const carpeta = `${taskId}-${tarea}/${autor}`
    let path = `${carpeta}/${file.name}`
    // Sin distinguir mayúsculas: en Windows y macOS "A.txt" y "a.txt" chocan al descomprimir.
    for (let n = 2; usadas.has(path.toLowerCase()); n++) path = `${carpeta}/${conSufijo(file.name, n)}`
    usadas.add(path.toLowerCase())
    return { path, file }
  })
}

export const NOMBRE_ACTA = 'ACTA-DE-ENTREGA.md'

/** ZIP con los bytes originales de cada archivo y, si se da, el acta en la raíz. */
export function armarZip(entregas: readonly Entrega[], tasks: readonly Task[], members: readonly Member[], acta?: string) {
  const zip = new JSZip()
  for (const { path, file } of rutasZip(entregas, tasks, members)) zip.file(path, file.arrayBuffer())
  if (acta) zip.file(NOMBRE_ACTA, acta)
  return zip
}
