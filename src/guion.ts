export type Paso = {
  desde: number
  hasta: number
  titulo: string
  vista: 'tablero' | 'contingencia' | 'rescate' | 'entrega'
  decir: string
  hacer: string
  /** Al entrar, carga dos entregas de ejemplo y ofrece completar la tercera. */
  preparaEntregas?: true
  /** Al entrar, marca «Resumen depende de Ficha» para que el atraso simulado bloquee a otra tarea. */
  preparaRescate?: true
}

/** Guion de 60 s (05_GUION_DEMO_60_SEGUNDOS.md). */
export const PASOS: readonly Paso[] = [
  {
    desde: 0, hasta: 10, titulo: 'El problema', vista: 'tablero',
    decir: 'En muchos proyectos, el equipo no sabe cuándo se está saturando ni cómo reaccionar ante un imprevisto. Aquí el equilibrio está en 100, y si alguien falta, TeamGuard ya sabe quién lo cubre.',
    hacer: 'Señala «Equilibrio 100/100» y pulsa «¿Y si alguien falta?»: cualquiera se puede cubrir.',
  },
  {
    desde: 10, hasta: 20, titulo: 'Sobrecarga', vista: 'tablero',
    decir: 'Si la Ficha pasa a Ana, TeamGuard avisa antes de que ocurra: 125 % y el equilibrio baja a 86. Nada cambia hasta que alguien lo decide.',
    hacer: '«Simular asignación» → Ficha pasa a Ana; señala «Equilibrio 100 → 86». Luego «Cancelar simulación».',
  },
  {
    desde: 20, hasta: 35, titulo: 'Ausencia', vista: 'contingencia',
    decir: 'Ana se ausenta y el equilibrio cae a 57: solo 57 de cada 100 horas pendientes caben en el tiempo real de quien las tiene. Solo guardamos las fechas, nunca el motivo. TeamGuard propone a Luis: 57 → 100 si aceptas.',
    hacer: '«Registrar ausencia» → señala «Equilibrio 57 → 100 si aceptas» → «Aceptar».',
  },
  {
    desde: 35, hasta: 45, titulo: 'Atraso', vista: 'rescate',
    decir: '¿Y si en vez de faltar alguien se atrasa? Si la Ficha de Luis se atrasa 2 días, sin intervenir terminan el 24 de noviembre; con el plan de rescate, el 20.',
    hacer: 'Elige «Ficha (Luis)» → «Simular atraso» → «Aplicar plan».',
    preparaRescate: true,
  },
  {
    desde: 45, hasta: 52, titulo: 'Entrega', vista: 'entrega',
    decir: 'Aquí se ve quién entregó y qué falta. El boceto lo subió Ana antes de ausentarse y conserva su autoría.',
    hacer: 'Pulsa «Completar el Resumen» para la última aportación.',
    preparaEntregas: true,
  },
  {
    desde: 52, hasta: 60, titulo: 'Cierre', vista: 'entrega',
    decir: 'La gráfica del equilibrio cuenta la historia: 100, 57, 100. TeamGuard no hace la tarea: protege los acuerdos, equilibra la colaboración y reúne el trabajo real del equipo.',
    hacer: '«Descargar ZIP» y abre ACTA-DE-ENTREGA.md: decisiones y gráfica del equilibrio (100 → 57 → 100).',
  },
]
