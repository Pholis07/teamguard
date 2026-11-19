import { describe, expect, it } from 'vitest'
import { apilarAviso } from './pilaAvisos'

const deshacer = () => {}
describe('apilarAviso', () => {
  it('un aviso con Deshacer le quita el Deshacer a los anteriores y conserva su texto', () => {
    const l = apilarAviso(apilarAviso([], { texto: 'Ausencia', deshacer }), { texto: 'Cobertura', deshacer })
    expect(l.map((a) => a.texto)).toEqual(['Ausencia', 'Cobertura'])
    expect(l[0].deshacer).toBeUndefined()
    expect(l[1].deshacer).toBe(deshacer)
  })
  it('un aviso sin Deshacer no toca el de los anteriores', () => {
    const l = apilarAviso([{ texto: 'A', deshacer }], { texto: 'Info' })
    expect(l[0].deshacer).toBe(deshacer)
  })
  it('la pila se limita a 2: se van los más viejos', () => {
    type A = { texto: string; deshacer?: () => void }
    let l: A[] = []
    for (const texto of ['1', '2', '3']) l = apilarAviso(l, { texto })
    expect(l.map((a) => a.texto)).toEqual(['2', '3'])
  })
})
