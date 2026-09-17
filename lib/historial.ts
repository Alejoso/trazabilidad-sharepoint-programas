import type { Contenido, DocumentoVisto, Version } from "./types";

/**
 * Convierte los registros de una fila en una lista de versiones numerada.
 *
 * La numeración es por fila, no por nombre de archivo: el documento más
 * antiguo de la fila es la primera versión y todo lo posterior cuenta como
 * edición, aunque el archivo se llame distinto.
 *
 * Un mismo archivo puede aparecer varias veces con el mismo contenido (el
 * script lo vuelve a ver en ejecuciones posteriores); eso no es una edición,
 * así que de cada par (nombre, contenido) nos quedamos con la primera vez que
 * se vio. La deduplicación mira el nombre además del hash para no fundir dos
 * documentos distintos que casualmente tengan los mismos bytes.
 */
export function versionesDeFila(
  vistos: DocumentoVisto[],
  contenidos: Map<string, Contenido>,
): Version[] {
  const primeras = new Map<string, DocumentoVisto>();

  for (const v of vistos) {
    const clave = `${v.nombre}|${v.content_hash}`;
    const previo = primeras.get(clave);
    if (previo === undefined || v.visto_en < previo.visto_en) {
      primeras.set(clave, v);
    }
  }

  return [...primeras.values()]
    .sort((a, b) => a.visto_en.localeCompare(b.visto_en))
    .map((v, i) => ({
      nombre: v.nombre,
      content_hash: v.content_hash,
      visto_en: v.visto_en,
      numero: i + 1,
      url: contenidos.get(v.content_hash)?.url ?? null,
      bytes: contenidos.get(v.content_hash)?.bytes ?? null,
    }));
}

export function indexarContenidos(contenidos: Contenido[]) {
  return new Map(contenidos.map((c) => [c.content_hash, c]));
}
