import type { Member, Task } from '../domain'
import type { NombreIcono } from './bloques'

/* Formato: las cifras se redondean solo al mostrarlas. */
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
export const fecha = (iso: string) => `${Number(iso.slice(8, 10))}\u00a0${MESES[Number(iso.slice(5, 7)) - 1]}`
/** «19 al 21 nov» si comparten mes; si no, «30 nov al 2 dic». */
export const rango = (desde: string, hasta: string) =>
  desde.slice(0, 7) === hasta.slice(0, 7) ? `${Number(desde.slice(8, 10))} al ${fecha(hasta)}` : `${fecha(desde)} al ${fecha(hasta)}`
export const horas = (h: number) => (Number.isInteger(h) ? String(h) : h.toFixed(1))
export const pct = (p: number | null) => (p === null ? '—' : `${Math.round(p)} %`)
export const plural = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios)

export const miembroPorId = (members: readonly Member[], id: string) => members.find((m) => m.id === id)

/* Páginas de la app (barra lateral y migas). */
export type PaginaId = 'tablero' | 'integrantes' | 'tareas' | 'contingencia' | 'rescate' | 'entrega'
export const PAGINAS: readonly { id: PaginaId; icono: NombreIcono; label: string }[] = [
  { id: 'tablero', icono: 'tablero', label: 'Tablero' },
  { id: 'integrantes', icono: 'integrantes', label: 'Integrantes' },
  { id: 'tareas', icono: 'tareas', label: 'Tareas' },
  { id: 'contingencia', icono: 'contingencia', label: 'Contingencia' },
  { id: 'rescate', icono: 'escudo', label: 'Rescate' },
  { id: 'entrega', icono: 'entrega', label: 'Entrega' },
]

export type Tema = 'oscuro' | 'claro'
export type Acento = 'grafito' | 'ambar' | 'verde' | 'azul' | 'violeta' | 'rosa'
/** Muestra: color en tema oscuro; `claro` es el tono usado en tema claro (para que la muestra se vea igual que el acento). */
export const ACENTOS: readonly { id: Acento; label: string; swatch: string; claro: string }[] = [
  { id: 'grafito', label: 'Grafito', swatch: '#F2F2F2', claro: '#161616' },
  { id: 'ambar', label: 'Ámbar', swatch: '#F5A524', claro: '#B45309' },
  { id: 'verde', label: 'Verde', swatch: '#3DD68C', claro: '#15803D' },
  { id: 'azul', label: 'Azul', swatch: '#4C9AFF', claro: '#2563EB' },
  { id: 'violeta', label: 'Violeta', swatch: '#A78BFA', claro: '#7C3AED' },
  { id: 'rosa', label: 'Rosa', swatch: '#F472B6', claro: '#BE185D' },
]
const CLAVE_ACENTO = 'tg-acento'
/** Acento que la persona eligió de forma explícita; null si nunca eligió (entonces manda el sugerido por versión). */
export function acentoGuardado(): Acento | null {
  try {
    const v = localStorage.getItem(CLAVE_ACENTO)
    return ACENTOS.some((a) => a.id === v) ? (v as Acento) : null
  } catch {
    return null
  }
}
export function aplicarAcento(a: Acento) {
  document.documentElement.dataset.acento = a
}
export function guardarAcento(a: Acento) {
  try {
    localStorage.setItem(CLAVE_ACENTO, a)
  } catch {
    // Sin almacenamiento: el acento solo dura esta sesión.
  }
}
export type Proyecto = { nombre: string; ejemplo: boolean }

/* Colores de etiqueta (escala monocroma + alerta) y sus usos fijos. */
export type ColorEtiqueta = 'gris' | 'cafe' | 'naranja' | 'amarillo' | 'verde' | 'azul' | 'morado' | 'rosa' | 'rojo'
export const ESTADO_TAREA: Record<Task['status'], { texto: string; color: ColorEtiqueta }> = {
  pending: { texto: 'Pendiente', color: 'gris' },
  active: { texto: 'En progreso', color: 'azul' },
  done: { texto: 'Completada', color: 'verde' },
}
export const COLOR_RIESGO = { Bajo: 'verde', Medio: 'amarillo', Alto: 'rojo' } as const satisfies Record<string, ColorEtiqueta>

/* Validación previa a enviar datos al dominio (que lanza Error con datos inválidos). */
export const nombreValido = (s: string) => s.trim().length > 0
export const horasValidas = (h: number) => Number.isFinite(h) && h >= 0
export function fechaValida(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false
  const d = new Date(`${iso}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso
}

/** Hora local «HH:MM» para la bitácora; la pone quien despacha, no el reducer. */
export const ahora = () => new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
