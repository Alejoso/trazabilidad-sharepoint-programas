import type { Contenido, Documento, DocumentoVisto, Version } from "./types";

/**
 * Agrupa los registros de `documentos_vistos` por nombre de documento y
 * convierte cada content_hash distinto en una versión numerada.
 *
 * Un mismo hash puede aparecer varias veces (el script lo vuelve a ver en
 * ejecuciones posteriores); eso no es una edición, así que nos quedamos con
 * la primera vez que se vio ese contenido.
 */
export function agruparDocumentos(
  vistos: DocumentoVisto[],
  contenidos: Map<string, Contenido>,
): Documento[] {
  const porNombre = new Map<string, Map<string, string>>();

  for (const v of vistos) {
    let hashes = porNombre.get(v.nombre);
    if (!hashes) porNombre.set(v.nombre, (hashes = new Map()));

    const previo = hashes.get(v.content_hash);
    if (previo === undefined || v.visto_en < previo) {
      hashes.set(v.content_hash, v.visto_en);
    }
  }

  const documentos: Documento[] = [];

  for (const [nombre, hashes] of porNombre) {
    const versiones: Version[] = [...hashes]
      .map(([content_hash, visto_en]) => ({ content_hash, visto_en }))
      .sort((a, b) => a.visto_en.localeCompare(b.visto_en))
      .map((v, i) => ({
        ...v,
        numero: i + 1,
        url: contenidos.get(v.content_hash)?.url ?? null,
        bytes: contenidos.get(v.content_hash)?.bytes ?? null,
      }));

    documentos.push({
      nombre,
      versiones,
      ultimoCambio: versiones[versiones.length - 1].visto_en,
    });
  }

  return documentos.sort((a, b) => b.ultimoCambio.localeCompare(a.ultimoCambio));
}

export function indexarContenidos(contenidos: Contenido[]) {
  return new Map(contenidos.map((c) => [c.content_hash, c]));
}
