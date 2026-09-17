import Link from "next/link";
import {
  getContenidos,
  getDocumentosVistos,
  getFilas,
  SupabaseError,
} from "@/lib/supabase";
import { agruparDocumentos, indexarContenidos } from "@/lib/historial";
import { diaLocal, fecha, hace, pesoArchivo } from "@/lib/format";
import type { Evento } from "@/lib/types";
import { Filtros, leerFiltros } from "@/components/filtros";
import {
  Descargar,
  ErrorDatos,
  EtiquetaTipo,
  Extension,
  Panel,
  Titulo,
  Vacio,
} from "@/components/ui";

export const dynamic = "force-dynamic";

const POR_PAGINA = 100;

/** Agrupa los eventos por día (hora de Bogotá) para separar la lista. */
function porDia(eventos: Evento[]) {
  const dias = new Map<string, Evento[]>();
  for (const e of eventos) {
    const dia = diaLocal(e.visto_en) ?? e.visto_en.slice(0, 10);
    const lista = dias.get(dia);
    if (lista) lista.push(e);
    else dias.set(dia, [e]);
  }
  return [...dias];
}

export default async function ActividadPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filtros = leerFiltros(sp);
  const filtroTipo = sp.tipo === "alta" || sp.tipo === "edicion" ? sp.tipo : null;
  const pagina = Math.max(1, Number(sp.pagina) || 1);

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

  const indice = indexarContenidos(contenidos);
  const porFila = new Map<number, typeof vistos>();
  for (const v of vistos) {
    const lista = porFila.get(v.sp_id);
    if (lista) lista.push(v);
    else porFila.set(v.sp_id, [v]);
  }

  // El número de versión depende del historial completo de cada documento,
  // así que agrupamos fila por fila antes de aplanar todo en una sola línea
  // de tiempo.
  const datosFila = new Map(filas.map((f) => [f.sp_id, f]));
  let eventos: Evento[] = [];

  for (const [spId, suyos] of porFila) {
    const fila = datosFila.get(spId);
    for (const doc of agruparDocumentos(suyos, indice)) {
      for (const v of doc.versiones) {
        eventos.push({
          sp_id: spId,
          programa: fila?.programa ?? null,
          modificado_por: fila?.modificado_por ?? null,
          nombre: doc.nombre,
          content_hash: v.content_hash,
          visto_en: v.visto_en,
          url: v.url,
          bytes: v.bytes,
          numero: v.numero,
          tipo: v.numero === 1 ? "alta" : "edicion",
        });
      }
    }
  }

  eventos.sort((a, b) => b.visto_en.localeCompare(a.visto_en));

  const total = eventos.length;

  if (filtroTipo) eventos = eventos.filter((e) => e.tipo === filtroTipo);

  if (filtros.q) {
    const aguja = filtros.q.toLowerCase();
    eventos = eventos.filter(
      (e) =>
        (e.programa ?? "").toLowerCase().includes(aguja) ||
        (e.modificado_por ?? "").toLowerCase().includes(aguja),
    );
  }

  if (filtros.desde || filtros.hasta) {
    eventos = eventos.filter((e) => {
      const dia = diaLocal(e.visto_en);
      if (!dia) return false;
      if (filtros.desde && dia < filtros.desde) return false;
      if (filtros.hasta && dia > filtros.hasta) return false;
      return true;
    });
  }

  const filtrados = eventos.length;
  const paginas = Math.max(1, Math.ceil(filtrados / POR_PAGINA));
  const actual = Math.min(pagina, paginas);
  const visibles = eventos.slice((actual - 1) * POR_PAGINA, actual * POR_PAGINA);

  const enlace = (extra: Record<string, string | null>) => {
    const p = new URLSearchParams();
    if (filtros.q) p.set("q", filtros.q);
    if (filtros.desde) p.set("desde", filtros.desde);
    if (filtros.hasta) p.set("hasta", filtros.hasta);
    if (filtroTipo) p.set("tipo", filtroTipo);
    for (const [k, v] of Object.entries(extra)) {
      if (v === null) p.delete(k);
      else p.set(k, v);
    }
    const s = p.toString();
    return s ? `/actividad?${s}` : "/actividad";
  };

  return (
    <>
      <Titulo sub="Todas las altas y ediciones de documentos, del cambio más reciente al más antiguo.">
        Actividad
      </Titulo>

      <Filtros
        valores={filtros}
        ruta="/actividad"
        placeholder="Buscar por programa o persona…"
        etiquetaFecha="Fecha del cambio"
        ocultos={filtroTipo ? { tipo: filtroTipo } : undefined}
      />

      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
        {(
          [
            [null, "Todo"],
            ["alta", "Primera versión"],
            ["edicion", "Sólo ediciones"],
          ] as const
        ).map(([valor, texto]) => {
          const activo = filtroTipo === valor;
          return (
            <Link
              key={texto}
              href={enlace({ tipo: valor, pagina: null })}
              aria-current={activo ? "true" : undefined}
              className="rounded-full border px-3 py-1 font-medium transition-opacity hover:opacity-70"
              style={{
                borderColor: activo ? "var(--acento)" : "var(--borde)",
                color: activo ? "var(--acento)" : "var(--texto-suave)",
                background: activo ? "var(--acento-suave)" : "var(--panel)",
              }}
            >
              {texto}
            </Link>
          );
        })}
        <span
          className="ml-auto tabular-nums"
          style={{ color: "var(--texto-suave)" }}
        >
          {filtrados === total
            ? `${total} ${total === 1 ? "evento" : "eventos"}`
            : `${filtrados} de ${total} eventos`}
        </span>
      </div>

      {visibles.length === 0 ? (
        <Vacio>No hay eventos que coincidan con el filtro.</Vacio>
      ) : (
        <div className="space-y-6">
          {porDia(visibles).map(([dia, delDia]) => (
            <section key={dia}>
              <h2
                className="mb-2 text-xs font-medium uppercase tracking-wide"
                style={{ color: "var(--texto-suave)" }}
              >
                {fecha(`${dia}T12:00:00Z`, true)}
              </h2>
              <Panel className="overflow-hidden">
                <ul>
                  {delDia.map((e) => (
                    <li
                      key={`${e.sp_id}-${e.nombre}-${e.content_hash}`}
                      className="border-b px-5 py-3 last:border-0"
                      style={{ borderColor: "var(--borde)" }}
                    >
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <EtiquetaTipo tipo={e.tipo} />
                        <Extension nombre={e.nombre} />
                        <span className="text-sm font-medium break-all">
                          {e.nombre}
                        </span>
                        <span
                          className="font-mono text-xs"
                          style={{ color: "var(--texto-suave)" }}
                        >
                          v{e.numero}
                        </span>
                        <span className="ml-auto">
                          <Descargar url={e.url} />
                        </span>
                      </div>
                      <div
                        className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
                        style={{ color: "var(--texto-suave)" }}
                      >
                        <Link
                          href={`/programa/${e.sp_id}`}
                          className="enlace-programa font-medium underline underline-offset-2"
                        >
                          {e.programa || "Sin título"}
                        </Link>
                        {e.modificado_por ? <span>{e.modificado_por}</span> : null}
                        <span>{hace(e.visto_en)}</span>
                        <span className="tabular-nums">
                          {pesoArchivo(e.bytes)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>
            </section>
          ))}
        </div>
      )}

      {paginas > 1 ? (
        <nav className="mt-6 flex items-center justify-between text-sm">
          {actual > 1 ? (
            <Link
              href={enlace({ pagina: String(actual - 1) })}
              className="underline underline-offset-2"
              style={{ color: "var(--acento)" }}
            >
              ← Anteriores
            </Link>
          ) : (
            <span />
          )}
          <span style={{ color: "var(--texto-suave)" }}>
            Página {actual} de {paginas}
          </span>
          {actual < paginas ? (
            <Link
              href={enlace({ pagina: String(actual + 1) })}
              className="underline underline-offset-2"
              style={{ color: "var(--acento)" }}
            >
              Siguientes →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </>
  );
}
