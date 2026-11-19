/** Pila de avisos: solo el aviso más reciente con «Deshacer» puede deshacerse; así un Deshacer viejo nunca deja el estado inconsistente. */
export const MAXIMO_AVISOS = 2

type ConDeshacer = { deshacer?: () => void }

/** Agrega `nuevo` al final (el más reciente, junto a la esquina). Si trae «Deshacer», los anteriores lo pierden pero conservan su texto. */
export function apilarAviso<T extends ConDeshacer>(lista: readonly T[], nuevo: T, maximo = MAXIMO_AVISOS): T[] {
  const previos = nuevo.deshacer ? lista.map((a) => (a.deshacer ? { ...a, deshacer: undefined } : a)) : [...lista]
  return [...previos, nuevo].slice(-maximo)
}
