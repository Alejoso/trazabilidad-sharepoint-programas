# Trazabilidad de programas (SharePoint → Supabase → web)

Dos piezas que comparten la misma base de datos:

- **`main.py`** — ingesta. Lee los sidecars y binarios que Power Automate deja
  en Dropbox y los registra en Supabase.
- **App Next.js** (`app/`, `lib/`, `components/`) — consulta esas tablas y
  muestra el historial de cambios de cada fila de la lista de SharePoint.

## Cómo se leen los datos

| Tabla | Qué es |
| --- | --- |
| `filas` | Una fila de la lista de SharePoint (`sp_id` = ID de SharePoint). |
| `contenidos` | Un archivo único, identificado por su `content_hash`. |
| `documentos_vistos` | Cada vez que se vio el documento *nombre* de la fila *sp_id* con el contenido *content_hash*. |

La app deriva el historial de `documentos_vistos`: para un mismo
`(sp_id, nombre)`, **cada `content_hash` distinto es una versión**, numerada por
la primera vez que se vio. Volver a ver el mismo hash no cuenta como edición,
así que ejecutar `main.py` varias veces no infla las cifras.

- v1 → «Versión original»
- v2 en adelante → «Edición»

## Páginas

- `/` — listado de programas con documentos, ediciones y última edición real.
- `/programa/[spId]` — metadatos de la fila y, por cada documento, todas sus
  versiones con fecha, tamaño, hash y enlace de descarga.
- `/actividad` — línea de tiempo global, agrupada por día, filtrable por texto
  y por tipo (altas / ediciones).

## Variables de entorno

Copia `.env.example` a `.env.local` y rellena los valores:

```bash
cp .env.example .env.local
```

| Variable | Para qué |
| --- | --- |
| `SUPABASE_URL` | URL del proyecto Supabase. |
| `SUPABASE_KEY` | Clave de servicio o anon. |
| `APP_PASSWORD` | Contraseña compartida para entrar a la app. |
| `DBX_*` | Sólo las usa `main.py`. |

`SUPABASE_KEY` **no lleva el prefijo `NEXT_PUBLIC_`** a propósito: todas las
consultas se hacen desde el servidor, así que la clave nunca llega al
navegador.

`main.py` lee `.env` y Next.js lee `.env.local`. Si prefieres un solo archivo,
usa `.env` para ambos: Next.js también lo carga.

## Desarrollo

```bash
npm install && npm run dev
```

## Despliegue en Vercel

El plan Hobby de Vercel es gratuito y suficiente para esta app.

1. Sube el repositorio a GitHub.
2. En Vercel: **Add New → Project** e importa el repositorio. Detecta Next.js
   solo; no hay que tocar los comandos de build.
3. En **Settings → Environment Variables** añade `SUPABASE_URL`,
   `SUPABASE_KEY` y `APP_PASSWORD` para Production, Preview y Development.
4. **Deploy**.

`main.py`, `requirements.txt` y `venv/` están en `.vercelignore`: la ingesta
sigue corriendo donde la ejecutes hoy, Vercel sólo publica la web.

## Acceso

Todo está detrás de una contraseña compartida (`APP_PASSWORD`), comprobada en
`proxy.ts` antes de que se sirva cualquier página. La cookie de sesión guarda
un SHA-256 de la contraseña, no la contraseña, y es `HttpOnly` + `Secure` en
producción. Dura 30 días; «Salir» la borra.

Para cambiar la contraseña, cambia la variable en Vercel y vuelve a desplegar:
las sesiones abiertas dejan de ser válidas automáticamente.

## Permisos en Supabase

Si las tablas tienen RLS activado y usas la clave `anon`, las consultas
devuelven listas vacías sin error. Tienes dos opciones:

- usar la clave de servicio (`service_role`) en `SUPABASE_KEY`, que salta RLS
  y sólo vive en el servidor; o
- añadir políticas de `SELECT` para `anon` en `filas`, `contenidos` y
  `documentos_vistos`.
