# Pokédex · Explorador en tiempo real

Aplicación web construida con **Next.js 16 (App Router) + TypeScript** que muestra los
**1025 Pokémon** de las generaciones I–IX a partir de la [PokéAPI](https://pokeapi.co).
Permite buscar por nombre **en tiempo real** (incluyendo la cadena evolutiva), filtrar por
tipo y generación, y consultar la ficha completa de cada Pokémon con sus estadísticas y
evoluciones.

> Prueba técnica para **BinPar**. El objetivo era una solución moderna, bien estructurada,
> con tipado sólido y decisiones técnicas justificadas. Este README explica el _qué_ y,
> sobre todo, el _por qué_.

---

## 🔗 Demo y repositorio

- **Demo online:** _<añade aquí la URL de Render tras el despliegue, p. ej. `https://pokedex.onrender.com`>_
- **Repositorio:** _<URL del repo público de GitHub>_

> Alternativa sin desplegar nada: **`docker compose up --build`** y abre `http://localhost:3000`.

---

## ⚡ Arranque rápido

Requisitos: **Node ≥ 20** y **pnpm** (`npm i -g pnpm`). El primer arranque descarga los datos
de la PokéAPI y genera un índice local (~1–2 s).

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

O con un único comando y sin instalar nada más que Docker:

```bash
docker compose up --build   # http://localhost:3000
```

---

## ✅ Requisitos funcionales cubiertos

| Requisito                                    | Implementación                                                                             |
| -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Listado ordenado por id**                  | Grid virtualizado con los 1025 Pokémon; orden por nº ascendente por defecto.               |
| **Nombre, generación y tipos**               | Cada tarjeta muestra nº de Pokédex, nombre, generación y badges de tipo.                   |
| **Filtro por tipo**                          | Selector accesible con los 18 tipos.                                                       |
| **Filtro por generación**                    | Selector con las 9 generaciones y su región.                                               |
| **Buscador por nombre en tiempo real**       | Filtra a medida que escribes, sin recargar.                                                |
| **Búsqueda incluyendo evoluciones**          | Buscar `pikachu` muestra también `pichu` y `raichu` (familia evolutiva completa).          |
| **Página de detalle**                        | Nombre, imagen, generación, tipos, estadísticas y evoluciones.                             |
| **Evoluciones con imágenes y navegación**    | Cadena evolutiva con ramas (p. ej. Eevee); cada nodo enlaza a su ficha.                    |
| **Pokémon actual identificado en su cadena** | El nodo actual se resalta con su color de tipo y la etiqueta «Actual».                     |
| **Estado preservado al volver**              | Filtros, texto de búsqueda, orden y posición de scroll se mantienen al volver del detalle. |
| **No es necesario preservar tras recargar**  | El scroll vive en memoria (se resetea al recargar); los filtros van en la URL.             |
| **Entrega**                                  | Repo público + Docker (`docker compose up`) + despliegue en Render.                        |

**Extras** que he añadido: **asistente IA «Pregúntale a la Pokédex»** (chat con Claude, ver
más abajo), tema claro/oscuro con toggle, diseño responsive, ordenación configurable
(nº / nombre), navegación anterior/siguiente en el detalle, descripción de la Pokédex en
español, estados de carga (skeletons) y de error, accesibilidad (roles ARIA, foco visible)
y `prefers-reduced-motion`.

---

## 🧱 Stack y por qué

| Tecnología                                                  | Motivo                                                                                        |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Next.js 16 (App Router)**                                 | Server Components para el fetch de datos, streaming, y un único framework para SSR + cliente. |
| **TypeScript (modo estricto + `noUncheckedIndexedAccess`)** | Tipado sólido de extremo a extremo.                                                           |
| **Tailwind CSS v4**                                         | Sistema de diseño por _tokens_ (CSS-first) con tema claro/oscuro por variables.               |
| **Zod**                                                     | Valida las respuestas de la PokéAPI en la frontera → datos de confianza y tipados.            |
| **nuqs**                                                    | Estado de filtros en la URL de forma tipada (compartible y preservable).                      |
| **@tanstack/react-virtual**                                 | Virtualización del listado de 1025 tarjetas → rendimiento y scroll fluido.                    |
| **Radix UI (Select)**                                       | Selectores accesibles (teclado, ARIA) sin reinventar la rueda.                                |
| **framer-motion**                                           | Micro-animaciones de las barras de estadísticas y transiciones.                               |
| **next-themes**                                             | Tema claro/oscuro sin _flash_ de hidratación.                                                 |
| **Vitest + Testing Library**                                | Tests unitarios de la lógica pura (búsqueda, filtros, normalización).                         |

---

## 🏗️ Arquitectura y decisiones

### 1. Origen de datos: índice pre-generado + detalle en vivo

La PokéAPI obliga a muchas peticiones para componer un listado completo (tipos y generación
por Pokémon, cadenas evolutivas…). En lugar de golpear la API en cada carga, el proyecto
distingue dos caminos:

- **Listado** → un **índice** (`src/data/pokedex.generated.json`) que se genera **desde la
  PokéAPI** con `scripts/build-pokedex.ts`. Lo interesante es que se construye de forma
  eficiente (**~580 peticiones, una sola vez**) mapeando **por id**:
  - `9 × /generation` → id de especie → generación,
  - `18 × /type` → id → tipos (mapear por id resuelve las formas por defecto especiales,
    p. ej. `deoxys` → `deoxys-normal`),
  - `~549 × /evolution-chain` → id → familia evolutiva.

  El índice se lee en el servidor con `fs` (fuera del _bundle_ JS) y se pasa al cliente.
  Se regenera automáticamente en los _hooks_ `predev`/`prebuild` y dentro de la imagen Docker.

- **Detalle** → se obtiene **en vivo desde la PokéAPI** (`/pokemon`, `/pokemon-species`,
  `/evolution-chain`) en un Server Component, con caché **ISR** (`revalidate`). Así la ficha
  siempre refleja la fuente y se deduplica el _fetch_ entre `generateMetadata` y la página con
  React `cache()`.

> **Decisión clave:** pre-generar el índice prioriza un arranque instantáneo y fiable (nada
> de 580 peticiones en cada _cold start_ de Render), manteniendo el detalle verdaderamente en
> vivo. El índice es un artefacto derivado de la PokéAPI, no datos «hardcodeados».

### 2. Búsqueda con expansión evolutiva

La lógica vive en un módulo **puro y testeado** (`src/lib/pokedex/search.ts`):

1. Se normaliza la consulta (sin acentos ni signos: `Flabébé` → `flabebe`).
2. Se buscan coincidencias directas por nombre y se recogen sus **familias evolutivas**
   (cada Pokémon lleva su `familyId`).
3. Se expande el resultado a **todos los miembros** de esas familias.
4. Se aplican los filtros de tipo/generación sobre el conjunto expandido (semántica **AND**).

Las coincidencias directas se marcan (`directMatchIds`) para resaltar el Pokémon buscado
frente a sus evoluciones.

### 3. Preservación del estado al volver del detalle

- **Filtros, búsqueda y orden** viven en la **URL** (`?q=&type=&gen=&sort=`) vía `nuqs` con
  `history: "replace"`. Al pulsar «atrás» desde el detalle, la lista se reconstruye con el
  estado exacto (y además es compartible por enlace).
- **La posición de scroll** se guarda en un módulo en memoria (`scroll-store.ts`): sobrevive a
  la navegación cliente pero **se resetea al recargar** — justo lo que pide el enunciado.

### 4. Rendimiento del listado

- **Virtualización por ventana**: solo se montan las filas visibles (de ~1025 tarjetas), con
  altura de fila fija para que la restauración de scroll sea exacta.
- Columnas responsive calculadas por ancho de viewport.
- `next/image` con carga diferida y degradación de _sprite_ ante fallos.
- `optimizePackageImports` para `lucide-react` y `framer-motion`.

### 5. Tema y diseño

Sistema de tokens en `globals.css`: **claro minimalista premium** y **oscuro neón** (con
_glows_ tintados por el tipo del Pokémon), conmutados por clase con `next-themes`. Colores de
tipo con contraste de texto calculado por luminancia (WCAG).

### 6. Asistente IA «Pregúntale a la Pokédex»

Chat flotante potenciado por **Claude** (API de Anthropic) que responde preguntas sobre
cualquier Pokémon (comparativas, evoluciones, stats…). Puntos clave:

- **Grounded con _tool use_**: el modelo no inventa datos; llama a herramientas server-side
  (`buscar_pokemon`, `detalle_pokemon`) que consultan el índice local y la PokéAPI. Bucle
  agéntico manual con **streaming** (`src/app/api/chat/route.ts`).
- **Seguridad**: la `ANTHROPIC_API_KEY` vive **solo en el servidor** (route handler); nunca
  llega al cliente. Rate limiting básico en memoria y validación de entrada con Zod.
- **Degradación elegante**: si no hay clave, el endpoint responde `enabled: false` y el widget
  **no se muestra** — la app funciona igual sin IA.
- **UX**: respuestas en streaming (NDJSON), y _chips_ clicables de los Pokémon mencionados que
  enlazan a su ficha.

Para activarlo: define `ANTHROPIC_API_KEY` (y opcionalmente `CHAT_MODEL`) en tu `.env`.

---

## 🗂️ Estructura del proyecto

```
src/
├── app/                        # Rutas (App Router)
│   ├── page.tsx                # Home (Server Component → índice)
│   ├── pokemon/[id]/page.tsx   # Detalle (fetch en vivo con ISR)
│   ├── loading / error / not-found
│   └── globals.css             # Tokens de tema + tipos
├── components/
│   ├── pokedex/                # Explorer, grid virtualizado, filtros, tarjeta…
│   ├── pokemon/                # Badge de tipo, stats, cadena evolutiva…
│   ├── ui/                     # Select accesible (Radix)
│   └── providers, header, footer, theme-toggle
├── lib/
│   ├── pokeapi/                # Cliente con reintentos + schemas Zod
│   ├── pokedex/                # Dominio: tipos, búsqueda (pura), detalle, constantes…
│   ├── url-state.ts            # Filtros en la URL (nuqs)
│   └── scroll-store.ts         # Memoria de scroll
└── data/pokedex.generated.json # Índice generado (git-ignored)

scripts/build-pokedex.ts        # Ingesta desde la PokéAPI
```

---

## 📜 Scripts

| Comando                        | Qué hace                                                                  |
| ------------------------------ | ------------------------------------------------------------------------- |
| `pnpm dev`                     | Genera el índice (si hace falta) y arranca el dev server.                 |
| `pnpm build`                   | Genera el índice y compila para producción (salida _standalone_).         |
| `pnpm start`                   | Sirve el build. En producción se usa el server _standalone_ (ver Docker). |
| `pnpm pokedex:build`           | Regenera el índice desde la PokéAPI (`--force`).                          |
| `pnpm test`                    | Tests unitarios (Vitest).                                                 |
| `pnpm lint` / `pnpm typecheck` | ESLint / comprobación de tipos.                                           |
| `pnpm format`                  | Prettier.                                                                 |

---

## 🧪 Tests

Cubren la lógica de negocio pura (sin red, deterministas):

- **Búsqueda con expansión evolutiva** (`pikachu` → `pichu`, `pikachu`, `raichu`).
- Combinación de filtros con semántica AND, orden, y estados vacíos.
- Normalización de texto (acentos, signos) y utilidades de formato.

```bash
pnpm test
```

---

## 🔧 Variables de entorno

Todas son opcionales (hay valores por defecto sensatos). Ver `.env.example`.

| Variable                     | Por defecto                 | Descripción                                                               |
| ---------------------------- | --------------------------- | ------------------------------------------------------------------------- |
| `POKEAPI_BASE_URL`           | `https://pokeapi.co/api/v2` | Base de la PokéAPI.                                                       |
| `POKEAPI_REVALIDATE_SECONDS` | `86400`                     | TTL de caché (ISR) del detalle.                                           |
| `ANTHROPIC_API_KEY`          | _(vacío)_                   | Habilita el asistente IA; sin ella el chat no aparece. **Solo servidor.** |
| `CHAT_MODEL`                 | `claude-opus-4-8`           | Modelo del chat (p. ej. `claude-haiku-4-5` para menor coste).             |

---

## 🚀 Despliegue

### Render (Docker)

El repo incluye un `render.yaml` (Blueprint). En Render: **New → Blueprint**, selecciona el
repo y despliega. Render construye la imagen con el `Dockerfile` (que genera el índice y
compila Next en modo _standalone_) y la sirve.

### Docker en local

```bash
docker compose up --build   # http://localhost:3000
```

La imagen es multi-stage y usa la salida _standalone_ de Next (`node server.js`), por lo que
es pequeña y arranca rápido.

---

## 🤖 Uso de IA

Dos planos distintos:

- **Como herramienta de desarrollo**: he usado un asistente de IA (Claude) para acelerar el
  andamiaje repetitivo, contrastar enfoques (estrategia de datos, virtualización, preservación
  de estado) y depurar. Todas las decisiones de arquitectura, la estructura del código y los
  _trade-offs_ descritos aquí son propios y puedo defenderlos y explicarlos en detalle.
- **Como parte del producto**: la app integra un asistente basado en **Claude** (API de
  Anthropic) con _tool use_ para responder sobre Pokémon de forma fundamentada (ver
  «Asistente IA» arriba).

---

## 📄 Créditos

Datos de la [PokéAPI](https://pokeapi.co). Pokémon © Nintendo / Game Freak. Proyecto con
fines educativos y de evaluación técnica.
