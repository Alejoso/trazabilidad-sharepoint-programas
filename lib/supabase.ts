import "server-only";
import type { Contenido, DocumentoVisto, Fila } from "./types";

const SB = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_KEY;

/** Techo de filas por petición; PostgREST corta en 1000 si no se pide más. */
const MAX = 10_000;

export class SupabaseError extends Error {}

function base() {
  if (!SB || !KEY) {
    throw new SupabaseError(
      "Faltan SUPABASE_URL o SUPABASE_KEY en las variables de entorno.",
    );
  }
  return { url: SB.replace(/\/$/, ""), key: KEY };
}

async function query<T>(tabla: string, params: Record<string, string>) {
  const { url, key } = base();
  const qs = new URLSearchParams(params).toString();

  const res = await fetch(`${url}/rest/v1/${tabla}?${qs}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      // Sin este techo PostgREST devolvería como mucho 1000 filas en silencio.
      Range: `0-${MAX - 1}`,
    },
    // Los datos los escribe un script externo, así que no cacheamos entre
    // peticiones: cada carga refleja el estado real de la tabla.
    cache: "no-store",
  });

  if (!res.ok) {
    throw new SupabaseError(
      `Supabase respondió ${res.status} al consultar "${tabla}": ${(await res.text()).slice(0, 300)}`,
    );
  }
  return (await res.json()) as T[];
}

export function getFilas() {
  return query<Fila>("filas", {
    select: "*",
    order: "actualizado_en.desc.nullslast",
  });
}

export async function getFila(spId: number) {
  const filas = await query<Fila>("filas", {
    select: "*",
    sp_id: `eq.${spId}`,
    limit: "1",
  });
  return filas[0] ?? null;
}

export function getDocumentosVistos(spId?: number) {
  return query<DocumentoVisto>("documentos_vistos", {
    select: "*",
    order: "visto_en.asc",
    ...(spId === undefined ? {} : { sp_id: `eq.${spId}` }),
  });
}

export async function getContenidos(hashes?: string[]) {
  if (hashes && hashes.length === 0) return [];
  return query<Contenido>("contenidos", {
    select: "*",
    ...(hashes ? { content_hash: `in.(${hashes.map((h) => `"${h}"`).join(",")})` } : {}),
  });
}
