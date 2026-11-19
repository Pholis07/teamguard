# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Estudiantes universitarios (UTCH) que trabajan en equipo en un proyecto de clase. Usan TeamGuard en el navegador, en el teléfono o en la PC, para saber quién tiene capacidad, qué falta y cómo reaccionar si alguien se ausenta.

## Product Purpose
Espacio digital de colaboración que detecta la sobrecarga del equipo, cubre una ausencia temporal con aprobación humana y reúne las entregas en una descarga ZIP local. Funciona cuando cualquiera identifica, sin instrucciones, quién tiene capacidad y qué tareas faltan.

## Positioning
TeamGuard no hace la tarea: protege los acuerdos, equilibra la colaboración y reúne el trabajo real del equipo. Ninguna reasignación ocurre sin que una persona la acepte.

## Operating Context
Demo de hackatón (Espacios Inteligentes, UTCH, 19 nov 2026). Tres pantallas: Tablero, Contingencia y Entrega. Se trabaja con datos ficticios en el navegador. El ZIP se descarga localmente; no se sube a Moodle de forma automática.

## Capabilities and Constraints
- Carga = horas de tareas pendientes y activas / horas disponibles. Si pasa de 100 % hay sobrecarga.
- Una simulación de asignación no cambia nada hasta que se confirma; se puede cancelar.
- Las propuestas de cobertura se aceptan, editan (cambiar de candidato) o rechazan. Solo aceptar cambia el responsable.
- La ausencia muestra solo el estado y las fechas, nunca un diagnóstico ni documentos.
- El ZIP se habilita cuando cada tarea obligatoria tiene al menos un archivo, y conserva los archivos sin modificarlos, con su nombre original y su autor.
- Stack: React + Vite + TypeScript, JSZip. La interfaz es de la Persona A (`src/ui/`). Las reglas son de B (`src/domain/`), la entrega de C (`src/delivery/`) y la integración de D.
- Fuera del MVP: historial y avisos de incumplimiento.

## Brand Commitments
Nombre: TeamGuard. Guía del kit: azul marino, cian, fondo claro y tipografía legible. Los indicadores siempre llevan texto, no solo color. El tono de los avisos de sobrecarga no culpa a nadie.

## Evidence on Hand
Caso común ficticio: Ana (m1, 4 h), Luis (m2, 6 h), Sol (m3, 4 h); t1 Boceto de Ana, 3 h; t2 Ficha de Luis, 2 h; t3 Resumen de Sol, 2 h. No hay usuarios reales, testimonios ni métricas: no hay que inventarlos.

## Product Principles
1. Decide la persona; TeamGuard propone.
2. Lo importante debe verse en la primera mirada: capacidad, faltantes y próximo paso.
3. La privacidad va antes que el detalle.
4. Se trata de cuidar al equipo, no de vigilarlo ni de castigar a nadie.

## Accessibility & Inclusion
Revisar a 390 px y a 1440 px. Los estados (sobrecarga, ausente, pendiente) deben entenderse sin color. Contraste AA y foco visible.
