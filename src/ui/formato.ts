import type { Member } from '../domain'

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
