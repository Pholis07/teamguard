# Mockups TeamGuard

## v4 · dirección vigente (Tablero aprobado)

Referencias: Gumloop, Solidroad, Cofounder y la galería Godly. Esta es la base para construir la app en `src/ui/`; ya no se hacen más mockups.

- `v4/tablero.html`: el Tablero en HTML y CSS. Se abre directo en el navegador. En `<div class="tg">` agrega `dark` para verlo en oscuro.
- `v4/tablero-1440-claro.png` y `v4/tablero-1440-oscuro.png`: capturas de referencia.
- Logo en `public/brand/`: el tigre blanco y negro con fondo transparente, el logo completo y `favicon-512.png`.

**Reglas del sistema:**
- **Color 60/30/10:**
  - 60: hoja blanca (`--bg #FFFFFF`).
  - 30: marco grafito (`--shell #0B0F14`) con la barra lateral encima.
  - 10: cian (`--ac #0891B2`), solo para progreso, foco, la sección activa y el contador de la campana.
  - Ámbar y verde solo para estados, siempre con texto.
- **Tipos:**
  - Instrument Serif para el título, los subtítulos, la marca y el lema.
  - Geist para la interfaz.
  - Geist Mono para las cifras (`.num`).
- **Título en dos tonos:** una frase de estado en negro y el contexto en gris (`--i3`).
- **Estructura:**
  - Marco con margen de 8 px.
  - Hoja con radio de 14 px y barra superior: migas, campana y avatar.
  - Franja de 4 métricas separadas solo por líneas.
  - Carga del equipo en filas: avatar, cifra, barra con la marca de disponibilidad y una etiqueta de horas libres.
  - Tabla con filtros en píldora.
- **Barra lateral:** etiquetas grises por grupo, sección activa con punto cian, contador en mono y lema al pie («El trabajo es de todos.» / *«La responsabilidad también.»*).
- **Botones:** en forma de píldora. El primario usa fondo `ink`; el cian nunca se usa en botones.
- **Simulación:** las horas de más aparecen como un tramo rayado ámbar (`.hatch`) que pasa la marca de disponibilidad.

Los tokens en claro y oscuro están en el bloque `<style>` de `v4/tablero.html`.

## v2 (histórico)

Dirección visual: **premium tipo Apple/Notion**, con modo claro y oscuro.

- **Figma (página v2):** https://www.figma.com/design/kmDmm58YCtPgsYilUP4OXA?node-id=6-2
- **Prototipo escritorio:** https://www.figma.com/proto/kmDmm58YCtPgsYilUP4OXA?node-id=11-2&starting-point-node-id=11%3A2
- **Prototipo móvil:** https://www.figma.com/proto/kmDmm58YCtPgsYilUP4OXA?node-id=11-440&starting-point-node-id=11%3A440

Las capturas están en `v2/`: Tablero, Contingencia y Entrega, en 1440 y 390 px, más una muestra en oscuro.

## Tokens (variables de Figma «TG v2»)

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| bg | #FBFBFA | #0A0F1A | fondo |
| surface | #FFFFFF | #111827 | paneles |
| surface-2 | #F4F5F7 | #172033 | pistas de barra, chips, fila activa |
| border | #0B1B33 al 9 % | #FFFFFF al 8 % | bordes de 1 px |
| ink / ink-2 / ink-3 | #0B1B33 / #566173 / #7C8698 | #F2F4F8 / #A3ADBF / #7A8599 | texto |
| accent | #0EA5C6 | #22B8DA | progreso, foco y selección |
| warn | #B45309 | #F5A524 | sobrecarga, siempre con texto e icono |
| ok | #15803D | #3FCF8E | «Cabe», «Lista» |
| danger | #C0362C | #F87171 | «Rechazar» |

- **Tipografía:** Inter. Títulos de 30–32 en Bold con tracking −3 %. Cifras de 40 en Semi Bold. Texto de 14.
- **Medidas:** radio de 14 en paneles, 8 en botones y 6 en insignias. Barra lateral de 232 px. En móvil, pestañas inferiores con desenfoque.
- **Botón primario:** fondo `ink` con texto `on-ink`. El color cian no se usa en botones, solo para progreso y foco.
- **Simulación:** las horas de más aparecen como un tramo rayado ámbar que pasa la marca del 100 %.

La dirección de diseño completa está en `PRODUCT.md`.
