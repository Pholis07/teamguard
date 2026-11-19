import { describe, expect, it } from 'vitest'
import { atajoDeTecla, TECLA_DE, TECLA_PAGINA, type Contexto } from './atajos'

const libre: Contexto = { ctrl: false, meta: false, alt: false, escribiendo: false, presentando: false, dialogo: false }

describe('atajoDeTecla', () => {
  it('1–5 llevan a las páginas en el orden de la barra', () => {
    expect(['1', '2', '3', '4', '5'].map((k) => atajoDeTecla(k, libre))).toEqual([
      { tipo: 'pagina', pagina: 'tablero' },
      { tipo: 'pagina', pagina: 'integrantes' },
      { tipo: 'pagina', pagina: 'tareas' },
      { tipo: 'pagina', pagina: 'contingencia' },
      { tipo: 'pagina', pagina: 'entrega' },
    ])
  })
  it('s simula y ? abre la ayuda', () => {
    expect(atajoDeTecla('s', libre)).toEqual({ tipo: 'simular' })
    expect(atajoDeTecla('?', libre)).toEqual({ tipo: 'ayuda' })
  })
  it('ignora teclas que no son atajos', () => {
    expect(atajoDeTecla('6', libre)).toBeNull()
    expect(atajoDeTecla('x', libre)).toBeNull()
  })
  it('se calla al escribir, con modificadores, al presentar o con un diálogo abierto', () => {
    for (const c of [{ escribiendo: true }, { ctrl: true }, { meta: true }, { alt: true }, { presentando: true }, { dialogo: true }]) {
      expect(atajoDeTecla('1', { ...libre, ...c })).toBeNull()
      expect(atajoDeTecla('?', { ...libre, ...c })).toBeNull()
    }
  })
  it('TECLA_DE es la inversa de TECLA_PAGINA', () => {
    for (const [k, p] of Object.entries(TECLA_PAGINA)) expect(TECLA_DE[p]).toBe(k)
  })
})
