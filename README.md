# ⚽ Pollapp — Polla Mundialera 2026

Web para pronosticar los partidos del Mundial 2026 y competir por puntos con tu
grupo. Hecha con **Next.js 16** + **Supabase** (base de datos + login) y pensada
para publicarse en **Vercel**.

## Qué hace

- **Login con link mágico** (sin contraseña): el jugador pone su correo y entra
  con un clic.
- **Partidos**: se abren cada día; el jugador pone su marcador y **cierra a las
  23:59 de Chile del día anterior** (bloqueo a prueba de trampas en la base de
  datos).
- **Puntaje automático**: marcador exacto = 3, diferencia/empate no exacto = 2,
  solo ganador = 1.
- **Bonos**: clasificados de grupos, tarjetas rojas, alargues, penales, goleador,
  mejor arquero, mejor jugador, dúo finalista — cada uno con su fecha de cierre.
- **Tabla de posiciones** en vivo.
- **Panel de administración** para ti: cargar resultados, abrir partidos, definir
  respuestas oficiales de bonos y marcar quién pagó.

---

## 🚀 Puesta en marcha (paso a paso)

### 1. Crear el proyecto en Supabase

1. Entra a <https://supabase.com> y crea una cuenta (gratis).
2. **New project**. Ponle nombre (ej. `pollapp`), una contraseña de base de
   datos (guárdala) y región cercana (ej. *South America (São Paulo)*).
3. Espera ~2 minutos a que se cree.

### 2. Crear las tablas

1. En Supabase, menú izquierdo → **SQL Editor** → **New query**.
2. Abre el archivo [`supabase/schema.sql`](supabase/schema.sql), copia **todo**,
   pégalo y presiona **Run**.
3. Repite con [`supabase/seed.sql`](supabase/seed.sql) (carga los bonos con sus
   fechas).

### 3. Copiar las llaves

1. Supabase → **Project Settings** (engranaje) → **API**.
2. Copia estos tres valores:
   - **Project URL**
   - **anon public** key
   - **service_role** key (¡secreta!)
3. En la carpeta del proyecto, crea el archivo **`.env.local`** (o edita el que
   ya viene) con tus valores:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

### 4. Configurar el login (URLs)

1. Supabase → **Authentication** → **URL Configuration**.
2. **Site URL**: por ahora `http://localhost:3000` (luego lo cambias a tu URL de
   Vercel).
3. **Redirect URLs** → agrega:
   - `http://localhost:3000/auth/callback`
   - (más tarde) `https://TU-APP.vercel.app/auth/callback`

> ⚠️ **Importante sobre los correos:** el correo gratis de Supabase tiene un
> límite bajo de envíos por hora. Para 30–100 jugadores conviene configurar un
> **SMTP propio** (Authentication → Emails → SMTP) con un servicio como Resend o
> Gmail. Si no, los links mágicos pueden demorar o no llegar cuando muchos entran
> a la vez.

### 5. Probar en tu computador

En la terminal (git bash), dentro de la carpeta del proyecto:

```bash
npm install      # solo la primera vez
npm run dev
```

Abre <http://localhost:3000>, entra con tu correo y revisa el link mágico.

### 6. Hacerte administrador

La primera vez te registras como jugador normal. Para darte permisos de admin:

1. Supabase → **SQL Editor** → New query → corre (con tu correo):

   ```sql
   update profiles set is_admin = true where email = 'tucorreo@gmail.com';
   ```

2. Recarga la web: ahora verás la pestaña **Admin**.

### 7. Cargar las selecciones (para los bonos de grupos y finalistas)

En **Admin → Selecciones**, agrega los equipos con su código, nombre y grupo
(ej. `CHI` / `Chile` / `D`). Sin esto, los bonos de clasificados y finalistas no
tienen de dónde elegir.

### 8. Crear y abrir partidos

En **Admin → Partidos**: crea cada partido (fase, equipos, día y hora de Chile).
Nace **oculto**; cuando quieras que los jugadores lo vean y pronostiquen,
presiona **🚀 Abrir**. El cierre (23:59 del día anterior) se calcula solo.

### 9. Cargar resultados

Cuando termine un partido, en **Admin → Partidos** escribe el marcador y
**💾 Resultado**. El sistema calcula los puntos de todos y actualiza la tabla.
Para los bonos, usa **Admin → Bonos** y guarda la respuesta oficial.

---

## ☁️ Publicar en Vercel

1. Sube el proyecto a GitHub (este repo `CompromisoPro/Pollapp`).
2. Entra a <https://vercel.com>, **Add New → Project**, importa el repo.
3. En **Environment Variables** agrega las mismas 3 del `.env.local`.
4. **Deploy**.
5. Cuando tengas la URL (`https://tu-app.vercel.app`), vuelve a Supabase →
   Authentication → URL Configuration y pon esa URL en **Site URL** y agrégala a
   **Redirect URLs** (`.../auth/callback`).

---

## 🧱 Cómo está hecho (para quien programe)

| Carpeta | Qué hay |
|---|---|
| `app/` | Páginas y rutas (App Router): `partidos`, `bonos`, `tabla`, `admin`, `login`, `auth/`. |
| `app/*/actions.ts` | Server Actions (guardar pronóstico, resultados, etc.). |
| `components/` | Componentes de interfaz. `admin/` tiene los del panel. |
| `lib/supabase/` | Clientes de Supabase: `server`, `client`, `admin` (service role), `proxy`. |
| `lib/scoring.ts` | Reglas de puntaje (marcadores y bonos). |
| `lib/time.ts` | Cálculo del cierre 23:59 hora Chile (maneja el cambio de hora). |
| `supabase/` | `schema.sql` (tablas + seguridad RLS) y `seed.sql` (bonos). |
| `proxy.ts` | "Middleware" de Next.js 16: refresca sesión y protege rutas. |

La seguridad (quién puede ver/editar qué, y el bloqueo por hora de cierre) está
en las políticas **RLS** de `schema.sql`, así que no se puede saltar desde el
navegador. El admin escribe usando la `service_role` solo desde el servidor.
