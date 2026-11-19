import JSZip from 'jszip'
import type { Member, Task } from '../domain'

/** Un archivo ligado a su tarea y a quien lo subió (la autoría no cambia al reasignar). */
export type Entrega = { taskId: string; uploaderId: string; file: File }

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

/** ZIP con los bytes originales de cada archivo. */
export function armarZip(entregas: readonly Entrega[], tasks: readonly Task[], members: readonly Member[]) {
  const zip = new JSZip()
  for (const { path, file } of rutasZip(entregas, tasks, members)) zip.file(path, file.arrayBuffer())
  return zip
}
