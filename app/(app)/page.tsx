import Link from "next/link";
import {
  getContenidos,
  getDocumentosVistos,
  getFilas,
  SupabaseError,
} from "@/lib/supabase";
import { diaLocal, fecha, hace } from "@/lib/format";
import { Filtros, hayFiltros, leerFiltros } from "@/components/filtros";
import {
  EnlaceFila,
  ErrorDatos,
  Estadistica,
  IrAlPrograma,
  Panel,
  Titulo,
  Vacio,
} from "@/components/ui";

export const dynamic = "force-dynamic";

type Resumen = {
  versiones: number;
  ediciones: number;
  ultimo: string | null;
};

export default async function Inicio({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const filtros = leerFiltros(await searchParams);

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

  // Mismo criterio que lib/historial.ts: las versiones se cuentan por fila y
  // volver a ver el mismo archivo con el mismo contenido no suma ninguna.
  const resumenes = new Map<number, Resumen>();
  const versionesVistas = new Set<string>();

  for (const v of vistos) {
    const clave = `${v.sp_id}|${v.nombre}|${v.content_hash}`;
    if (versionesVistas.has(clave)) continue;
    versionesVistas.add(clave);

    const r = resumenes.get(v.sp_id) ?? {
      versiones: 0,
      ediciones: 0,
      ultimo: null,
    };
    r.versiones++;
    if (r.ultimo === null || v.visto_en > r.ultimo) r.ultimo = v.visto_en;
    resumenes.set(v.sp_id, r);
  }

  // La más antigua de la fila es la primera versión; el resto son ediciones.
  for (const r of resumenes.values()) r.ediciones = Math.max(0, r.versiones - 1);

  // La fecha por la que se filtra es la misma que muestra la columna.
  const fechaDe = (spId: number, respaldo: string | null) =>
    resumenes.get(spId)?.ultimo ?? respaldo;

  const aguja = filtros.q.toLowerCase();
  const visibles = filas.filter((f) => {
    if (
      aguja &&
      !(f.programa ?? "").toLowerCase().includes(aguja) &&
      !(f.modificado_por ?? "").toLowerCase().includes(aguja) &&
      !(f.creado_por ?? "").toLowerCase().includes(aguja)
    ) {
      return false;
    }

    if (filtros.desde || filtros.hasta) {
      const dia = diaLocal(fechaDe(f.sp_id, f.actualizado_en));
      if (!dia) return false;
      if (filtros.desde && dia < filtros.desde) return false;
      if (filtros.hasta && dia > filtros.hasta) return false;
    }

    return true;
  });

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
        <Estadistica etiqueta="Versiones" valor={versionesVistas.size} />
        <Estadistica etiqueta="Ediciones" valor={totalEdiciones} />
        <Estadistica etiqueta="Archivos únicos" valor={contenidos.length} />
      </div>

      <Filtros
        valores={filtros}
        ruta="/"
        placeholder="Buscar por programa o persona…"
        etiquetaFecha="Última edición"
      />

      {visibles.length === 0 ? (
        <Vacio>
          {filas.length === 0
            ? "Todavía no hay filas registradas. Ejecuta main.py para poblar la base."
            : "Ningún programa coincide con los filtros."}
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
                  <th className="px-4 py-3 font-medium">Versiones</th>
                  <th className="px-4 py-3 font-medium">Ediciones</th>
                  <th className="px-4 py-3 font-medium">Modificado por</th>
                  <th className="px-4 py-3 font-medium">Última edición</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">Ver historial</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((f) => {
                  const r = resumenes.get(f.sp_id);
                  const ultimo = fechaDe(f.sp_id, f.actualizado_en);
                  return (
                    <tr
                      key={f.sp_id}
                      className="fila border-b last:border-0"
                      style={{ borderColor: "var(--borde)" }}
                    >
                      <td className="px-4 py-3">
                        <EnlaceFila spId={f.sp_id} programa={f.programa} />
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {r?.versiones ?? 0}
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
                      <td className="px-4 py-3 text-right">
                        <IrAlPrograma spId={f.sp_id} programa={f.programa} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {hayFiltros(filtros) && visibles.length > 0 ? (
        <p className="mt-3 text-xs" style={{ color: "var(--texto-suave)" }}>
          {visibles.length} de {filas.length} programas.
        </p>
      ) : null}

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
