# Spin Tournament 🏓

Aplicación web para organizar torneos de tenis de mesa con llaves de eliminación directa, inspirada en [torneos-mvp.com](https://torneos-mvp.com/): crear un torneo, cargar participantes, generar la llave automáticamente, registrar resultados partido a partido y seguir estadísticas de jugadores en un panel estilo dashboard.

## Funcionalidades

- **Dashboard** con estadísticas globales (torneos activos/finalizados, jugadores registrados, partidos jugados) y torneos recientes.
- **Crear torneos**: nombre del torneo + lista de participantes (cantidad ilimitada).
- **Edición de participantes** mientras el torneo esté en borrador (agregar, quitar, renombrar).
- **Sorteo automático de la llave**: al iniciar el torneo se mezclan los participantes al azar y se arma un cuadro de eliminación directa, completando con "BYE" (pase directo) cuando el número de participantes no es potencia de 2. Los BYE se distribuyen de forma pareja en el cuadro (algoritmo de seeding estándar de brackets).
- **Visualización de la llave** estilo torneo (rondas en columnas conectadas con líneas), mostrando los enfrentamientos de cada ronda: Octavos, Cuartos, Semifinales, Final, etc.
- **Carga de resultados** por partido con un modal simple (marcador de cada jugador). El ganador avanza automáticamente a la siguiente ronda.
- **Corrección de resultados**: si te equivocaste al cargar un marcador, podés volver a editarlo; la app revierte en cascada los resultados de las rondas siguientes que dependían de ese partido.
- **Campeón**: al completar la final se muestra un banner con el ganador del torneo.
- **Jugadores**: listado con estadísticas acumuladas (partidos, ganados, perdidos, % de victorias) a través de todos los torneos, y una ficha individual con el historial de partidos de cada jugador. *(Los jugadores se identifican por nombre — la app no tiene cuentas de usuario, así que dos personas con el mismo nombre se ven como un mismo jugador.)*
- **Búsqueda** de torneos y jugadores desde la barra superior.
- **Modo oscuro** (respeta la preferencia del sistema, con toggle manual persistido).
- **Eliminar torneos**.

No incluye arbitraje en vivo punto a punto (marcador en tiempo real por set) — la carga de resultados es el marcador final de cada partido.

## Stack técnico

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** para los estilos, con soporte de modo oscuro
- **SQLite-compatible** vía [`@libsql/client`](https://github.com/tursodatabase/libsql-client-ts): en desarrollo local usa un archivo SQLite (`data/tournament.db`, cero configuración); en producción apunta a una base [Turso](https://turso.tech) gratuita mediante variables de entorno, sin cambiar una sola línea de código.

Todo corre en un solo proceso (`npm run dev`), no hay backend separado ni contenedores que levantar.

## Cómo levantar el proyecto en local

Requisitos: [Node.js](https://nodejs.org/) 18 o superior (se probó con Node 24) y npm.

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar el servidor de desarrollo
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) en el navegador. Al primer request se crea automáticamente la carpeta `data/` con la base SQLite (`data/tournament.db`), no hace falta ningún paso manual adicional ni variables de entorno.

### Otros comandos

```bash
npm run build   # build de producción
npm run start   # sirve el build de producción (correr "build" antes)
npm run lint    # linter (ESLint)
```

### Reiniciar los datos locales

Si querés empezar de cero, simplemente borrá el archivo `data/tournament.db` (y `data/tournament.db-wal` / `-shm` si existen) con el servidor detenido; se vuelve a crear vacío en el próximo arranque.

## Cómo publicarlo gratis con un link público (Vercel + Turso)

El archivo SQLite local no sirve para un deploy público: en hosting serverless (como Vercel) el sistema de archivos no persiste entre invocaciones. La solución gratuita más simple es [Turso](https://turso.tech) (base de datos compatible con SQLite en la nube) + [Vercel](https://vercel.com) (hosting ideal para Next.js). Los pasos:

1. **Crear la base en Turso** (gratis, sin tarjeta):
   - Entrá a [turso.tech](https://turso.tech) y creá una cuenta.
   - Instalá su CLI y logueate: `curl -sSfL https://get.tur.so/install.sh | bash` (o ver [docs.turso.tech](https://docs.turso.tech/quickstart) para Windows).
   - `turso db create spin-tournament`
   - `turso db show spin-tournament --url` → copiá la URL (empieza con `libsql://...`).
   - `turso db tokens create spin-tournament` → copiá el token.

2. **Conectar el repo a Vercel**:
   - `npm install -g vercel` (o usá `npx vercel`).
   - `vercel login`
   - Desde la carpeta del proyecto: `vercel link` (crea el proyecto en tu cuenta).

3. **Configurar las variables de entorno en Vercel** (Project Settings → Environment Variables, o por CLI):
   ```bash
   vercel env add TURSO_DATABASE_URL
   vercel env add TURSO_AUTH_TOKEN
   ```
   Pegá la URL y el token obtenidos en el paso 1.

4. **Deploy**:
   ```bash
   vercel --prod
   ```
   Al terminar te da la URL pública (`https://tu-proyecto.vercel.app`) para compartir.

Cada vez que quieras actualizar el sitio, corré `vercel --prod` de nuevo (o conectá el repo a GitHub desde el dashboard de Vercel para que se despliegue solo con cada push).

## Estructura del proyecto

```
src/
  app/
    page.tsx                     # dashboard con estadisticas y torneos recientes
    torneos/page.tsx             # listado completo de torneos, con filtro por estado
    torneos/nuevo/page.tsx       # formulario de creacion
    torneos/[id]/page.tsx        # detalle: participantes o llave, segun el estado
    jugadores/page.tsx           # listado de jugadores con estadisticas
    jugadores/[name]/page.tsx    # ficha individual de un jugador
    buscar/page.tsx              # resultados de busqueda
    api/                         # endpoints REST usados por los componentes cliente
  components/
    Sidebar.tsx, SearchBar.tsx, ThemeToggle.tsx   # shell de la app
    CreateTournamentForm.tsx     # alta de torneo + participantes
    TournamentDraftPanel.tsx     # edicion de participantes antes de iniciar
    Bracket.tsx                  # visualizacion de la llave y carga de resultados
    StatCard.tsx, StatusPill.tsx, TournamentCard.tsx
    DeleteTournamentButton.tsx
  lib/
    db.ts                        # conexion @libsql/client (local o Turso) y creacion de tablas
    bracket.ts                   # logica del torneo: sorteo, avance de ganadores, resultados
    stats.ts                     # estadisticas agregadas (dashboard, jugadores, busqueda)
    types.ts
```
