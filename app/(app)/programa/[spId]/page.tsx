import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getContenidos,
  getDocumentosVistos,
  getFila,
  SupabaseError,
} from "@/lib/supabase";
import { agruparDocumentos, indexarContenidos } from "@/lib/historial";
import { fecha, hace, hashCorto, pesoArchivo } from "@/lib/format";
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

function Dato({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt
        className="text-xs uppercase tracking-wide"
        style={{ color: "var(--texto-suave)" }}
      >
        {etiqueta}
      </dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  );
}

export default async function ProgramaPage({
  params,
}: {
  params: Promise<{ spId: string }>;
}) {
  const spId = Number((await params).spId);
  if (!Number.isInteger(spId)) notFound();

  let fila, vistos, contenidos;
  try {
    [fila, vistos] = await Promise.all([getFila(spId), getDocumentosVistos(spId)]);
    contenidos = await getContenidos([...new Set(vistos.map((v) => v.content_hash))]);
  } catch (e) {
    return (
      <ErrorDatos
        mensaje={
          e instanceof SupabaseError ? e.message : "Error inesperado de red."
        }
      />
    );
  }

  if (!fila) notFound();

  const documentos = agruparDocumentos(vistos, indexarContenidos(contenidos));
  const ediciones = documentos.reduce((n, d) => n + d.versiones.length - 1, 0);

  return (
    <>
      <Link
        href="/"
        className="text-xs transition-opacity hover:opacity-70"
        style={{ color: "var(--texto-suave)" }}
      >
        ← Todos los programas
      </Link>

      <div className="mt-3">
        <Titulo
          sub={
            <>
              sp_id <span className="font-mono">{fila.sp_id}</span> ·{" "}
              {documentos.length}{" "}
              {documentos.length === 1 ? "documento" : "documentos"} ·{" "}
              {ediciones} {ediciones === 1 ? "edición" : "ediciones"}
            </>
          }
        >
          {fila.programa || "Sin título"}
        </Titulo>
      </div>

      <Panel className="mb-8 px-5 py-4">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4">
          <Dato etiqueta="Creado por">{fila.creado_por || "—"}</Dato>
          <Dato etiqueta="Creado en">{fecha(fila.creado_en)}</Dato>
          <Dato etiqueta="Modificado por">{fila.modificado_por || "—"}</Dato>
          <Dato etiqueta="Actualizado en">
            {fecha(fila.actualizado_en)}
            <div className="text-xs" style={{ color: "var(--texto-suave)" }}>
              {hace(fila.actualizado_en)}
            </div>
          </Dato>
        </dl>
      </Panel>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">
        Historial de documentos
      </h2>

      {documentos.length === 0 ? (
        <Vacio>
          Esta fila no tiene documentos registrados. Puede que su sidecar se
          procesara sin binarios asociados.
        </Vacio>
      ) : (
        <div className="space-y-4">
          {documentos.map((doc) => (
            <Panel key={doc.nombre} className="overflow-hidden">
              <div
                className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-5 py-3"
                style={{
                  borderColor: "var(--borde)",
                  background: "var(--panel-alt)",
                }}
              >
                <Extension nombre={doc.nombre} />
                <span className="text-sm font-medium break-all">
                  {doc.nombre}
                </span>
                <span
                  className="ml-auto text-xs whitespace-nowrap"
                  style={{ color: "var(--texto-suave)" }}
                >
                  {doc.versiones.length}{" "}
                  {doc.versiones.length === 1 ? "versión" : "versiones"} ·
                  última {hace(doc.ultimoCambio)}
                </span>
              </div>

              <ol className="px-5 py-2">
                {[...doc.versiones].reverse().map((v) => (
                  <li
                    key={v.content_hash}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b py-3 last:border-0"
                    style={{ borderColor: "var(--borde)" }}
                  >
                    <span
                      className="w-8 shrink-0 font-mono text-xs tabular-nums"
                      style={{ color: "var(--texto-suave)" }}
                    >
                      v{v.numero}
                    </span>
                    <EtiquetaTipo tipo={v.numero === 1 ? "alta" : "edicion"} />
                    <span className="text-sm whitespace-nowrap">
                      {fecha(v.visto_en)}
                    </span>
                    <span
                      className="font-mono text-xs"
                      style={{ color: "var(--texto-suave)" }}
                      title={v.content_hash}
                    >
                      {hashCorto(v.content_hash)}
                    </span>
                    <span
                      className="text-xs tabular-nums"
                      style={{ color: "var(--texto-suave)" }}
                    >
                      {pesoArchivo(v.bytes)}
                    </span>
                    <span className="ml-auto">
                      <Descargar url={v.url} />
                    </span>
                  </li>
                ))}
              </ol>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
