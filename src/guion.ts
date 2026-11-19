export type Paso = {
  desde: number
  hasta: number
  titulo: string
  vista: 'tablero' | 'contingencia' | 'entrega'
  decir: string
  hacer: string
  /** Al entrar, carga dos entregas de ejemplo y ofrece completar la tercera. */
  preparaEntregas?: true
}

/** Guion de 60 s (05_GUION_DEMO_60_SEGUNDOS.md). */
export const PASOS: readonly Paso[] = [
  {
    desde: 0, hasta: 10, titulo: 'El problema', vista: 'tablero',
    decir: 'En muchos proyectos, el equipo no sabe cuándo se está saturando ni cómo reaccionar ante un imprevisto. Aquí el equilibrio está en 100, y si alguien falta, TeamGuard ya sabe quién lo cubre.',
    hacer: 'Señala «Equilibrio 100/100» y pulsa «¿Y si alguien falta?»: cualquiera se puede cubrir.',
  },
  {
    desde: 10, hasta: 25, titulo: 'Sobrecarga', vista: 'tablero',
    decir: 'Si la Ficha pasa a Ana, TeamGuard avisa antes de que ocurra: 125 % y el equilibrio baja a 86. Nada cambia hasta que alguien lo decide.',
    hacer: '«Simular asignación» → Ficha pasa a Ana; señala «Equilibrio 100 → 86». Luego «Cancelar simulación».',
  },
  {
    desde: 25, hasta: 40, titulo: 'Ausencia', vista: 'contingencia',
    decir: 'Ana se ausenta y el equilibrio cae a 57. Solo guardamos las fechas, nunca el motivo. TeamGuard propone a Luis: 57 → 100 si aceptas. Una persona decide.',
    hacer: '«Registrar ausencia» → señala «Equilibrio 57 → 100 si aceptas» y Luis de 2 a 5 de 6 h → «Aceptar».',
  },
  {
    desde: 40, hasta: 50, titulo: 'Entrega', vista: 'entrega',
    decir: 'Aquí se ve quién entregó y qué falta. El boceto lo subió Ana antes de ausentarse y conserva su autoría.',
    hacer: 'Pulsa «Completar el Resumen» para la última aportación.',
    preparaEntregas: true,
  },
  {
    desde: 50, hasta: 60, titulo: 'Cierre', vista: 'entrega',
    decir: 'La gráfica del equilibrio cuenta la historia: 100, 57, 100. TeamGuard no hace la tarea: protege los acuerdos, equilibra la colaboración y reúne el trabajo real del equipo.',
    hacer: '«Descargar ZIP» y abre ACTA-DE-ENTREGA.md: decisiones y gráfica del equilibrio (100 → 57 → 100).',
  },
]
