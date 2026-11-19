# TeamGuard

Hackatón UTCH · 19 de noviembre. Detecta sobrecarga en un equipo, cubre una ausencia con aprobación humana y reúne los archivos en un ZIP local.

## Arranque

```bash
npm install
npm run dev
```

Abre http://localhost:5173

## Ramas y carpetas

| Persona | Rama | Carpeta |
|---|---|---|
| A | `feat/interfaz` | `src/ui/` |
| B | `feat/reglas` | `src/domain/` |
| C | `feat/entregas` | `src/delivery/` |
| D | `feat/integracion` | `src/App.tsx`, `src/main.tsx`, configuración y dependencias |

Cada quien crea su rama desde `main` y solo modifica su carpeta. D integra en `main`.

```bash
git clone https://github.com/Pholis07/teamguard.git
cd teamguard
git checkout -b feat/<tu-rama>
```
