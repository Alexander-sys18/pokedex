# Pokédex · Explorador en tiempo real

Aplicación web construida con **Next.js 16 (App Router) + TypeScript** que muestra los
**1025 Pokémon** de las generaciones I–IX a partir de la [PokéAPI](https://pokeapi.co).
Permite buscar por nombre **en tiempo real** (incluyendo la cadena evolutiva), filtrar por
tipo y generación, y consultar la ficha completa de cada Pokémon con sus estadísticas y
evoluciones. Además: **comparar dos Pokémon** lado a lado, **armar un equipo** con análisis
de cobertura de tipos, **guardar favoritos** (persistentes) y es **instalable como PWA**.

> Prueba técnica para **BinPar**. El objetivo era una solución moderna, bien estructurada,
> con tipado sólido y decisiones técnicas justificadas. Este README explica el _qué_ y,
> sobre todo, el _por qué_.

---

## 🔗 Demo y repositorio

- **Demo online:** [pokedex-uujc.onrender.com](https://pokedex-uujc.onrender.com)
  _(plan gratuito de Render: si lleva un rato sin visitas, la primera carga puede tardar ~30-60 s
  mientras la instancia despierta; después va fluida)_
- **Repositorio:** [github.com/Alexander-sys18/pokedex](https://github.com/Alexander-sys18/pokedex)

> Alternativa sin desplegar nada: **`docker compose up --build`** y abre `http://localhost:3000`.

> **Nota para evaluar:** el repositorio no contiene ningún secreto. La app completa funciona
> **sin configurar nada** (las funciones de IA se ocultan solas si no hay clave). En la **demo
> online** la IA está activa — la `ANTHROPIC_API_KEY` vive como variable de entorno del
> despliegue, nunca en el código. Para probar la IA en local, basta poner una clave propia en
> `.env` (ver `.env.example`).

---

## ⚡ Arranque rápido

Requisitos: **Node ≥ 20** y **pnpm** (`npm i -g pnpm`). El primer arranque descarga los datos
de la PokéAPI y genera un índice local (~10–30 s según la conexión; las siguientes veces usa
la caché y es instantáneo).

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

| Requisito                                    | Implementación                                                                                                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Listado ordenado por id**                  | Grid paginado (60/página, **instantáneo**: la paginación es un _slice_ en memoria); orden por nº ascendente por defecto.                                                 |
| **Nombre, generación y tipos**               | Cada tarjeta muestra nº de Pokédex, nombre, generación y badges de tipo.                                                                                                 |
| **Filtro por tipo**                          | Selector accesible con los 18 tipos, **más un segundo selector de tipo** para filtrar tipados duales (p. ej. Fuego + Volador).                                           |
| **Filtro por generación**                    | Selector con las 9 generaciones y su región.                                                                                                                             |
| **Buscador por nombre en tiempo real**       | Filtra a medida que escribes (input local instantáneo + **debounce de 300 ms** antes de propagar el filtro), sin recargar.                                               |
| **Búsqueda incluyendo evoluciones**          | Buscar `pikachu` muestra también `pichu` y `raichu` (familia evolutiva completa).                                                                                        |
| **Página de detalle**                        | Nombre, imagen (3D/shiny), generación, tipos, estadísticas (barras + radar) y evoluciones — más debilidades, localizaciones, cría, entrenamiento, curiosidades y formas. |
| **Evoluciones con imágenes y navegación**    | Cadena evolutiva con ramas (p. ej. Eevee) y el **método real de cada evolución** (nivel, piedra, amistad, intercambio…) bajo cada flecha; cada nodo enlaza a su ficha.   |
| **Pokémon actual identificado en su cadena** | El nodo actual se resalta con su color de tipo y la etiqueta «Actual».                                                                                                   |
| **Estado preservado al volver**              | Filtros, texto de búsqueda, orden y posición de scroll se mantienen al volver del detalle.                                                                               |
| **No es necesario preservar tras recargar**  | El scroll vive en memoria (se resetea al recargar); los filtros van en la URL.                                                                                           |
| **Entrega**                                  | Repo público + Docker (`docker compose up`) + despliegue en Render.                                                                                                      |

**Extras** que he añadido: **comparador** de dos Pokémon lado a lado y **constructor de equipo**
con análisis de tipos (ver §9), **favoritos** persistentes, **PWA instalable**, **ficha
enciclopédica** (dónde encontrarlo por juego, curiosidades de la Pokédex, debilidades/resistencias
explicadas, cría, entrenamiento, shiny, **sprite animado**, grito, formas, **cartas del JCC** con
**visor a pantalla completa**, radar de stats — ver §8), **visuales 3D** (tarjetas holográficas
con tilt + **modelos 3D reales giratorios** en el detalle, con fallback), **búsqueda por foto**
(Claude Vision) y **asistente «Profesor Oak»** (avatar oficial, **voz** por Web Speech,
**chat persistente** entre recargas y respuestas fundamentadas con herramientas); estos dos
últimos opcionales (ver más abajo); **paginación instantánea** con
página en la URL, **botón volver arriba**, **Pokémon del día** en la home; tema claro/oscuro con
toggle, cabecera con navegación e iconos monocromos, diseño responsive, ordenación configurable
(nº / nombre), navegación anterior/siguiente en el detalle, descripción de la Pokédex en
español, estados de carga (skeletons) y de error, animaciones sobrias (medidores y entradas,
con `prefers-reduced-motion`), accesibilidad (roles ARIA, foco visible).

---

## 🧱 Stack y por qué

| Tecnología                                                  | Motivo                                                                                        |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Next.js 16 (App Router)**                                 | Server Components para el fetch de datos, streaming, y un único framework para SSR + cliente. |
| **TypeScript (modo estricto + `noUncheckedIndexedAccess`)** | Tipado sólido de extremo a extremo.                                                           |
| **Tailwind CSS v4**                                         | Sistema de diseño por _tokens_ (CSS-first) con tema claro/oscuro por variables.               |
| **Zod**                                                     | Valida las respuestas de la PokéAPI en la frontera → datos de confianza y tipados.            |
| **nuqs**                                                    | Estado de filtros en la URL de forma tipada (compartible y preservable).                      |
| **Paginación client-side propia**                           | 60 tarjetas/página como _slice_ de la lista en memoria → instantánea, sin peticiones.         |
| **Radix UI (Select)**                                       | Selectores accesibles (teclado, ARIA) sin reinventar la rueda.                                |
| **Animaciones CSS propias**                                 | Medidores, entradas y micro-feedback sin librería de animación (menos _bundle_).              |
| **next-themes**                                             | Tema claro/oscuro sin _flash_ de hidratación.                                                 |
| **@anthropic-ai/sdk (Claude)**                              | Asistente con _tool use_ y búsqueda por foto (Claude Vision). Server-side.                    |
| **three / @react-three/fiber / drei**                       | Escena WebGL del detalle con **modelos 3D reales (.glb)** (carga diferida solo en esa ruta).  |
| **Vitest**                                                  | Tests unitarios de la lógica pura (búsqueda, filtros, normalización).                         |

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

### 4. Rendimiento del listado: paginación instantánea

- **Paginación client-side (60/página)**: como el índice completo ya está en memoria, cambiar
  de página o buscar es un simple _slice_ del array filtrado — **cero peticiones, respuesta
  inmediata**. La página vive en la URL (`?p=`), así que se **preserva al volver del detalle**
  y se **resetea automáticamente** al cambiar cualquier filtro (un nº de página solo tiene
  sentido respecto al conjunto sobre el que se calculó).
- La búsqueda y los filtros operan **siempre sobre el total** (los 1025), nunca sobre la página
  visible — la paginación no afecta a los resultados.
- **Botón flotante «volver arriba»** (aparece al bajar) para navegar cómodamente.
- Las tarjetas tienen alturas deterministas (cajas `aspect-square`), por lo que la restauración
  de scroll al volver del detalle es exacta incluso antes de que carguen las imágenes.
- `next/image` con carga diferida y degradación de _sprite_ ante fallos;
  `optimizePackageImports` para `lucide-react`.

> **Decisión:** inicialmente el listado usaba virtualización por ventana; se sustituyó por
> paginación (mejor orientación espacial y URLs compartibles por página) sin perder inmediatez,
> precisamente porque los datos ya viven en el cliente.

### 5. Tema y diseño

Sistema de tokens en `globals.css`: **claro minimalista premium** y **oscuro neón** (con
_glows_ tintados por el tipo del Pokémon), conmutados por clase con `next-themes`. Colores de
tipo con contraste de texto calculado por luminancia (WCAG).

### 6. IA en el producto: asistente + búsqueda por foto

Dos funciones potenciadas por **Claude** (API de Anthropic), ambas server-side y con la misma
`ANTHROPIC_API_KEY` (que **nunca** llega al cliente):

**Búsqueda por foto** (`src/app/api/vision/route.ts`). El usuario hace/sube una foto (arte,
dibujo, peluche, carta…) y **Claude Vision** identifica el Pokémon. La imagen se **comprime en
el cliente** (≤512px JPEG) para minimizar coste; el servidor resuelve el nombre a un id del
índice y rellena el buscador → reutiliza toda la búsqueda evolutiva existente. Si no reconoce
nada, lo dice con claridad.

**Asistente «Profesor Oak»** — chat flotante con el **Profesor Oak en persona** (su sprite
oficial como avatar, animado mientras «habla») que responde **cualquier duda Pokémon**: datos
y comparativas (fundamentados con herramientas), pero también trucos, estrategia, crianza,
capturas y curiosidades. Puntos clave:

- **Grounded con _tool use_**: el modelo no inventa datos; llama a herramientas server-side
  (`buscar_pokemon`, `detalle_pokemon` y `tabla_tipos` — esta última calcula debilidades con
  la tabla de tipos embebida, nunca de memoria). Bucle agéntico manual con **streaming** y
  **razonamiento adaptativo** (`src/app/api/chat/route.ts`).
- **Voz**: el Profesor puede **leer sus respuestas en voz alta** (Web Speech API del navegador,
  sin claves ni red), con toggle persistente y botón de releer por mensaje. El selector
  **prioriza las voces neuronales** del sistema (p. ej. las «Natural» de Edge o las de Google
  en Chrome) y prefiere español latino cuando está disponible.
- **Persistencia**: la conversación **sobrevive a recargas de página** (`sessionStorage`,
  por pestaña) y se puede reiniciar con un clic.
- **Seguridad**: la `ANTHROPIC_API_KEY` vive **solo en el servidor** (route handler); nunca
  llega al cliente. Rate limiting básico en memoria y validación de entrada con Zod.
- **Degradación elegante**: si no hay clave, el endpoint responde `enabled: false` y el widget
  **no se muestra** — la app funciona igual sin IA.
- **UX**: respuestas en streaming (NDJSON) con Markdown robusto (tablas, código; el HTML crudo
  se descarta), _chips_ clicables de los Pokémon mencionados, y aviso si la respuesta se corta
  por el límite de tokens.

Para activarlo: define `ANTHROPIC_API_KEY` (y opcionalmente `CHAT_MODEL`) en tu `.env`.

### 7. Visuales 3D (holográfico + WebGL + modelos reales)

- **Tarjetas holográficas** (listado): al pasar el puntero, cada tarjeta se **inclina en 3D**
  hacia el cursor con un **reflejo holográfico** que lo sigue. Es CSS 3D + un _callback ref_
  que escribe variables CSS directamente en el nodo (sin re-render por movimiento), así que
  sigue fluido en todo el grid. Respeta `prefers-reduced-motion`.
- **Modelos 3D reales en el detalle, bajo demanda** (`react-three-fiber` + `drei`): el arte
  oficial es la vista principal (SSR, es la identidad visual del Pokémon) y un botón **«3D»**
  monta el **modelo .glb real** (comprimido con Draco, ~97 % de la Pokédex, vía el CDN
  jsDelivr desde los assets de la comunidad
  [Pokémon 3D API](https://github.com/Pokemon-3D-api/assets)) para **girarlo 360°**; también
  en su variante **shiny**. Al ser _opt-in_, ni `three.js` ni el modelo se descargan hasta
  pulsar el botón (que solo aparece con WebGL y sin `prefers-reduced-motion`). El modelo se
  normaliza (escala/centro por _bounding box_, sin mutar la escena cacheada de `useGLTF`)
  para que Joltik y Wailord llenen el escenario igual; si el `.glb` no existe, un _error
  boundary_ cae al plano de arte flotante con la textura oficial.

### 8. Ficha «enciclopédica»: todo lo que la PokéAPI sabe de cada Pokémon

Además de lo básico, la página de detalle explota a fondo la PokéAPI (todo server-side, con
ISR — cero peticiones extra desde el cliente):

- **Dónde encontrarlo** (`/pokemon/{id}/encounters`): localizaciones salvajes agrupadas **por
  juego** (nombres de juegos en español, de más reciente a más antiguo). Si no aparece salvaje,
  lo explica (evolución / intercambio / eventos).
- **Curiosidades de la Pokédex**: entradas de distintas ediciones (deduplicadas, en español con
  _fallback_ a inglés) citadas con su juego de origen.
- **Notas del Profesor Oak**: cada ficha abre con un párrafo de **prosa viva compuesta
  determinísticamente a partir de los datos reales** (stat estrella, nivel competitivo del
  total base, aviso de debilidades ×4 o inmunidades, dificultad de captura, rarezas físicas)
  — personalidad sin coste de IA ni clave, y 100 % veraz por construcción.
- **Debilidades y resistencias**: la tabla de tipos Gen VI+ va **embebida como dato** y se
  calculan los multiplicadores (×4, ×2, ×½, ×¼, ×0) del tipado, **explicando en lenguaje llano
  qué significa cada uno** y por qué un tipado dual produce ×4/×¼ (los multiplicadores se
  multiplican entre sí) — con **tests unitarios** que fijan matchups conocidos y verifican la
  integridad de las 18×18 combinaciones (p. ej. Charizard ×4 Roca, inmune a Tierra). Incluye
  además la **cobertura ofensiva** del propio tipado (a qué tipos golpea ×2).
- **Entrenamiento**: ratio de captura y felicidad base (con medidor /255), ritmo de
  crecimiento, experiencia base y puntos de esfuerzo (EVs).
- **Cría**: grupos huevo, ciclos de eclosión (≈ pasos) y **ratio de género** con barra ♂/♀
  (o «Sin género»).
- **Rasgos**: habilidades (marcando la **oculta**), hábitat, color, silueta y objetos que puede
  llevar en estado salvaje.
- **Identidad**: categoría («Pokémon Ratón»), nombre **japonés** decorativo en katakana, e
  insignias de **Legendario / Singular / Bebé**.
- **Radar hexagonal de stats** (SVG puro, sin librerías) junto a las barras.
- **Shiny y grito**: alterna el arte normal/variocolor (también en la escena 3D) y reproduce el
  **grito** del Pokémon (audio de PokéAPI, se oculta si el navegador no soporta ogg).
- **Otras formas**: megaevoluciones, formas regionales y variantes con su propio arte.
- **Cartas del JCC**: escaneos reales de cartas coleccionables **en español** vía
  [TCGdex](https://tcgdex.dev) (gratuito, sin API key; server-side con ISR; la sección se
  oculta si no hay cartas).
- **Navegación anterior/siguiente** con nombre y sprite del vecino de la Pokédex.

> **Nota sobre veracidad:** todos los datos mostrados provienen de fuentes reales (PokéAPI y
> TCGdex) — nada está inventado ni "hardcodeado". Cuando una fuente no tiene datos (p. ej.
> PokéAPI no registra encuentros de Escarlata/Púrpura), la interfaz lo dice explícitamente en
> lugar de afirmar algo falso.

En la home: un **hero** con gradiente tintado por el tipo del día, chips con datos del dex
(1025 Pokémon, 541 familias, 9 generaciones, 18 tipos), CTAs y un **«Pokémon del día»**
determinista por fecha como ancla visual — calculado **en el servidor** con ISR horario
(`revalidate = 3600`), así la home sigue sirviéndose estática. Incluye un botón
**«Sorpréndeme»** que navega a una ficha aleatoria.

### 9. Comparador, equipo, favoritos y PWA

- **Comparador** (`/comparar?a=&b=`): compara dos Pokémon lado a lado con un lenguaje visual
  inequívoco — **verde gana / rojo pierde / gris empate** en cada barra, deltas numéricos por
  stat, y una tarjeta de **veredicto** (duelos de stats ganados, total base y **ventaja de
  tipos** calculada con la tabla embebida). Está **dirigido por la URL**: la selección vive en
  los _query params_, así que el servidor re-renderiza con datos reales (ISR) en cada cambio y
  **la comparación es compartible por enlace**. La selección es **optimista** (el elegido
  aparece al instante con un _spinner_ mientras carga) y el estado vacío ofrece duelos clásicos
  de un toque. El selector es un _combobox_ con búsqueda sobre el índice.
- **Constructor de equipo** (`/equipo`): crea y guarda **varios equipos con nombre**
  (localStorage, con migración del formato antiguo, renombrar/borrar y sincronización entre
  pestañas) de hasta 6 miembros, con **análisis de tipos** calculado en el cliente con la misma
  tabla embebida — **debilidades compartidas** (alerta si 3+ miembros son débiles al mismo
  tipo), **resistencias** del conjunto y **cobertura ofensiva** (cuántos de los 18 tipos golpea
  súper efectivo y qué huecos quedan).
- **Armar equipo con IA**: describe en texto libre lo que quieres («el mejor equipo
  equilibrado», «un equipo alrededor de Charizard»…) y el **Profesor Oak propone los 6** con
  la razón de cada elección, vía **salida estructurada** (JSON Schema) de Claude. Cada nombre
  propuesto se **valida en el servidor contra el índice real** (nombre → id de la Pokédex), así
  que nada inventado llega a la interfaz; luego puedes **aplicarlo al equipo activo o guardarlo
  como equipo nuevo**. Opcional como el resto de la IA: sin `ANTHROPIC_API_KEY` el panel no
  aparece.
- **Favoritos**: marca cualquier Pokémon con el corazón (en la tarjeta o en el detalle); se
  **persisten en `localStorage`** y se sincronizan entre pestañas. Un botón en los filtros
  muestra **solo tus favoritos**. Implementado con `useSyncExternalStore` (hidratación sin
  _mismatch_: el _snapshot_ de servidor es siempre vacío).
- **Visor de imágenes (lightbox)**: el arte del Pokémon y las **cartas del JCC** se abren a
  pantalla completa (alta resolución), con cierre por _Escape_, clic en el fondo o botón, y
  bloqueo del _scroll_ del cuerpo. Se monta vía _portal_ para escapar cualquier recorte.
- **PWA instalable**: `manifest.webmanifest` (generado por `app/manifest.ts`), icono _maskable_,
  `theme-color` por esquema de color y metadatos de _apple-web-app_ → la app se puede instalar
  en el dispositivo y abrir en modo _standalone_.

---

## 🗂️ Estructura del proyecto

```
src/
├── app/                        # Rutas (App Router)
│   ├── page.tsx                # Home (Server Component → índice)
│   ├── pokemon/[id]/page.tsx   # Detalle (fetch en vivo con ISR)
│   ├── comparar/page.tsx       # Comparador (dirigido por ?a=&b=, ISR)
│   ├── equipo/page.tsx         # Constructor de equipo (índice → cliente)
│   ├── manifest.ts             # Web App Manifest (PWA)
│   ├── api/{chat,vision,team}/ # Route handlers de IA (Claude)
│   ├── loading / error / not-found
│   └── globals.css             # Tokens de tema + tipos + animaciones
├── components/
│   ├── pokedex/                # Explorer, grid paginado, filtros, tarjeta, picker…
│   ├── pokemon/                # Badge de tipo, stats, cadena evolutiva, showcase…
│   ├── compare/                # Controles + vista del comparador
│   ├── team/                   # Constructor de equipo + análisis de tipos
│   ├── ui/                     # Select accesible (Radix), lightbox
│   └── providers, header, footer, theme-toggle
├── lib/
│   ├── pokeapi/                # Cliente con reintentos + schemas Zod
│   ├── pokedex/                # Dominio: tipos, búsqueda (pura), tabla de tipos, detalle…
│   ├── favorites.ts            # Store de favoritos (useSyncExternalStore + localStorage)
│   ├── team.ts                 # Store del equipo (localStorage)
│   ├── url-state.ts            # Filtros en la URL (nuqs)
│   └── scroll-store.ts         # Memoria de scroll
└── data/pokedex.generated.json # Índice generado (git-ignored)

public/icon-app.svg             # Icono PWA (maskable)
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

| Variable                     | Por defecto                 | Descripción                                                                                   |
| ---------------------------- | --------------------------- | --------------------------------------------------------------------------------------------- |
| `POKEAPI_BASE_URL`           | `https://pokeapi.co/api/v2` | Base de la PokéAPI.                                                                           |
| `POKEAPI_REVALIDATE_SECONDS` | `86400`                     | TTL de caché (ISR) del detalle.                                                               |
| `ANTHROPIC_API_KEY`          | _(vacío)_                   | Habilita el asistente IA; sin ella el chat no aparece. **Solo servidor.**                     |
| `CHAT_MODEL`                 | `claude-sonnet-5`           | Modelo del chat (`claude-haiku-4-5` para menor coste, `claude-opus-4-8` para máxima calidad). |

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

## 🔐 Seguridad

- **La clave de Anthropic nunca sale del servidor**: solo la leen los _route handlers_
  (`/api/chat`, `/api/vision`, `/api/team`) desde `process.env`; el navegador solo habla con
  nuestros endpoints. Sin clave, cada función de IA se desactiva sola (`enabled: false`).
- **Anti-abuso de coste**: _guard_ de **mismo origen** en los tres POST (un sitio de terceros
  no puede quemar tokens a través del navegador de un visitante) + **rate limiting** por IP
  en memoria (30/20/10 peticiones por 5 min según ruta; suficiente para esta escala — con
  varias réplicas se migraría a Redis/Upstash).
- **Validación en la frontera**: todas las entradas pasan por **Zod** (tamaños máximos, tipos
  MIME de imagen permitidos por regex, límites de mensajes) y las respuestas del modelo se
  validan también (salida estructurada del armador de equipos re-verificada contra el índice).
- **XSS**: el Markdown del chat se renderiza con `react-markdown` (**sin** `rehype-raw`,
  con `skipHtml`): el HTML crudo no se ejecuta ni se muestra, y los enlaces pasan por el
  `urlTransform` seguro por defecto (bloquea `javascript:`). No hay `dangerouslySetInnerHTML`.
- **Cabeceras**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: strict-origin-when-cross-origin` y `Permissions-Policy` restrictiva.
- **Imagen Docker**: multi-stage, usuario **no root**, `.dockerignore` excluye `.env*` del
  contexto y la etapa final **borra cualquier `.env`** que Next copiara al _standalone_ —
  la clave no se hornea en la imagen.
- **Dependencias**: `pnpm audit` limpio (override de `postcss` ≥ 8.5.10 para la única
  advisoria transitiva). Sin secretos en el repositorio ni en el historial de git.
- **Datos de usuario**: solo favoritos/equipos/chat en `localStorage`/`sessionStorage` del
  propio navegador — no hay cuentas, cookies ni datos personales en el servidor.

---

## 🤖 Uso de IA

Dos planos distintos:

- **Como herramienta de desarrollo**: he usado un asistente de IA (Claude) para acelerar el
  andamiaje repetitivo, contrastar enfoques (estrategia de datos, paginación, preservación
  de estado) y depurar. Todas las decisiones de arquitectura, la estructura del código y los
  _trade-offs_ descritos aquí son propios y puedo defenderlos y explicarlos en detalle.
- **Como parte del producto**: la app integra **Claude** (API de Anthropic) en dos funciones —
  un asistente con _tool use_ que responde de forma fundamentada, y una **búsqueda por foto**
  con Claude Vision (ver «IA en el producto» arriba).

---

## 📄 Créditos

Datos de la [PokéAPI](https://pokeapi.co). Cartas del JCC vía [TCGdex](https://tcgdex.dev).
Modelos 3D optimizados de [Pokémon 3D API](https://github.com/Pokemon-3D-api/assets) (vía
jsDelivr). Sprite del Profesor Oak vía [Pokémon Showdown](https://play.pokemonshowdown.com).
Pokémon © Nintendo / Game Freak. Proyecto con fines educativos y de evaluación técnica.
