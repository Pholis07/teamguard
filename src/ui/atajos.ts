import type { PaginaId } from './formato'

/** Acción que dispara una tecla en la app; null si la tecla no es un atajo. */
export type Atajo = { tipo: 'pagina'; pagina: PaginaId } | { tipo: 'simular' } | { tipo: 'ayuda' }

/** Teclas 1–5 en el orden de la barra lateral. */
export const TECLA_PAGINA: Readonly<Record<string, PaginaId>> = { 1: 'tablero', 2: 'integrantes', 3: 'tareas', 4: 'contingencia', 5: 'entrega' }
/** Tecla de cada página (inversa de TECLA_PAGINA) para mostrarla en la barra lateral. */
export const TECLA_DE: Readonly<Record<PaginaId, string>> = { tablero: '1', integrantes: '2', tareas: '3', contingencia: '4', entrega: '5' }

/** Evento de ventana con el que el atajo «s» pide abrir o cerrar la simulación del Tablero. */
export const EVENTO_SIMULAR = 'tg:simular'

export type Contexto = {
  ctrl: boolean
  meta: boolean
  alt: boolean
  /** Hay foco en un campo de texto, selector o elemento editable. */
  escribiendo: boolean
  /** La guía de Presentar está activa (usa ←/→ y Esc). */
  presentando: boolean
  /** Hay un diálogo abierto. */
  dialogo: boolean
}

/** Traduce una tecla en un atajo, ignorándola si se está escribiendo, hay modificadores, se presenta o hay un diálogo. */
export function atajoDeTecla(tecla: string, c: Contexto): Atajo | null {
  if (c.ctrl || c.meta || c.alt || c.escribiendo || c.presentando || c.dialogo) return null
  if (tecla in TECLA_PAGINA) return { tipo: 'pagina', pagina: TECLA_PAGINA[tecla] }
  if (tecla === 's' || tecla === 'S') return { tipo: 'simular' }
  if (tecla === '?') return { tipo: 'ayuda' }
  return null
}

/** ¿El elemento acepta texto o selección con el teclado? */
export function esCampo(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  return el.isContentEditable || el.closest('input, select, textarea, [contenteditable=""], [contenteditable="true"]') !== null
}
