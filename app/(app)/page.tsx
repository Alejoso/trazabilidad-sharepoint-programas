import Link from "next/link";
import {
  getContenidos,
  getDocumentosVistos,
  getFilas,
  SupabaseError,
} from "@/lib/supabase";
import { fecha, hace } from "@/lib/format";
import { Buscador } from "@/components/buscador";
import {
  EnlaceFila,
  ErrorDatos,
  Estadistica,
  Panel,
  Titulo,
  Vacio,
} from "@/components/ui";

export const dynamic = "force-dynamic";

type Resumen = {
  documentos: number;
  versiones: number;
  ediciones: number;
  ultimo: string | null;
};

export default async function Inicio({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const q = ((await searchParams).q ?? "").trim();

  let filas, vistos, contenidos;
  try {
    [filas, vistos, contenidos] = await Promise.all([
      getFilas(),
      getDocumentosVistos(),
      getContenidos(),
    ]);
  } catch (e) {
    return (
      <ErrorDatos
        mensaje={
          e instanceof SupabaseError ? e.message : "Error inesperado de red."
        }
      />
    );
  }

  // Un documento puede volver a verse con el mismo contenido; para contar
  // versiones sólo valen los pares (nombre, content_hash) distintos.
  const resumenes = new Map<number, Resumen>();
  const versionesVistas = new Set<string>();
  const documentosVistos = new Set<string>();

  for (const v of vistos) {
    const r = resumenes.get(v.sp_id) ?? {
      documentos: 0,
      versiones: 0,
      ediciones: 0,
      ultimo: null,
    };

    const claveDoc = `${v.sp_id}|${v.nombre}`;
    if (!documentosVistos.has(claveDoc)) {
      documentosVistos.add(claveDoc);
      r.documentos++;
    }

    // `ultimo` sólo avanza con contenido nuevo: volver a ver el mismo hash no
    // es una edición y no debe rejuvenecer la fila.
    const claveVersion = `${claveDoc}|${v.content_hash}`;
    if (!versionesVistas.has(claveVersion)) {
      versionesVistas.add(claveVersion);
      r.versiones++;
      if (r.ultimo === null || v.visto_en > r.ultimo) r.ultimo = v.visto_en;
    }

    resumenes.set(v.sp_id, r);
  }

  for (const r of resumenes.values()) r.ediciones = r.versiones - r.documentos;

  const aguja = q.toLowerCase();
  const visibles = q
    ? filas.filter(
        (f) =>
          String(f.sp_id).includes(aguja) ||
          (f.programa ?? "").toLowerCase().includes(aguja) ||
          (f.modificado_por ?? "").toLowerCase().includes(aguja) ||
          (f.creado_por ?? "").toLowerCase().includes(aguja),
      )
    : filas;

  const totalEdiciones = [...resumenes.values()].reduce(
    (n, r) => n + r.ediciones,
    0,
  );

  return (
    <>
      <Titulo sub="Cada fila de la lista de SharePoint y los documentos que ha tenido a lo largo del tiempo.">
        Programas
      </Titulo>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Estadistica etiqueta="Programas" valor={filas.length} />
        <Estadistica etiqueta="Documentos" valor={documentosVistos.size} />
        <Estadistica etiqueta="Ediciones" valor={totalEdiciones} />
        <Estadistica etiqueta="Archivos únicos" valor={contenidos.length} />
      </div>

      <Buscador valor={q} placeholder="Buscar por programa, autor o sp_id…" />

      {visibles.length === 0 ? (
        <Vacio>
          {filas.length === 0
            ? "Todavía no hay filas registradas. Ejecuta main.py para poblar la base."
            : `Ningún programa coincide con «${q}».`}
        </Vacio>
      ) : (
        <Panel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-sm">
              <thead>
                <tr
                  className="border-b text-left text-xs uppercase tracking-wide"
                  style={{
                    borderColor: "var(--borde)",
                    color: "var(--texto-suave)",
                  }}
                >
                  <th className="px-4 py-3 font-medium">Programa</th>
                  <th className="px-4 py-3 font-medium">Docs</th>
                  <th className="px-4 py-3 font-medium">Ediciones</th>
                  <th className="px-4 py-3 font-medium">Modificado por</th>
                  <th className="px-4 py-3 font-medium">Última edición</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((f) => {
                  const r = resumenes.get(f.sp_id);
                  const ultimo = r?.ultimo ?? f.actualizado_en;
                  return (
                    <tr
                      key={f.sp_id}
                      className="border-b last:border-0"
                      style={{ borderColor: "var(--borde)" }}
                    >
                      <td className="px-4 py-3">
                        <EnlaceFila spId={f.sp_id} programa={f.programa} />
                        <div
                          className="mt-0.5 font-mono text-xs"
                          style={{ color: "var(--texto-suave)" }}
                        >
                          sp_id {f.sp_id}
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {r?.documentos ?? 0}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {r?.ediciones ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        {f.modificado_por || (
                          <span style={{ color: "var(--texto-suave)" }}>—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>{fecha(ultimo, true)}</div>
                        <div
                          className="text-xs"
                          style={{ color: "var(--texto-suave)" }}
                        >
                          {hace(ultimo)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <p className="mt-4 text-xs" style={{ color: "var(--texto-suave)" }}>
        ¿Buscas los cambios más recientes de todos los programas a la vez?{" "}
        <Link
          href="/actividad"
          className="underline underline-offset-2"
          style={{ color: "var(--acento)" }}
        >
          Ver la actividad
        </Link>
        .
      </p>
    </>
  );
}
