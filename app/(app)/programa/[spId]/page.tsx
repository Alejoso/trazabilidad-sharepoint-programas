import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getContenidos,
  getDocumentosVistos,
  getFila,
  SupabaseError,
} from "@/lib/supabase";
import { indexarContenidos, versionesDeFila } from "@/lib/historial";
import { fecha, hace, pesoArchivo } from "@/lib/format";
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
    [fila, vistos] = await Promise.all([
      getFila(spId),
      getDocumentosVistos(spId),
    ]);
    contenidos = await getContenidos([
      ...new Set(vistos.map((v) => v.content_hash)),
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

  if (!fila) notFound();

  const versiones = versionesDeFila(vistos, indexarContenidos(contenidos));
  const ediciones = Math.max(0, versiones.length - 1);

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
              {versiones.length}{" "}
              {versiones.length === 1 ? "versión" : "versiones"} · {ediciones}{" "}
              {ediciones === 1 ? "edición" : "ediciones"}
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
        Historial
      </h2>

      {versiones.length === 0 ? (
        <Vacio>
          Este programa no tiene documentos registrados. Puede que su sidecar se
          procesara sin binarios asociados.
        </Vacio>
      ) : (
        <Panel className="overflow-hidden">
          <ol>
            {[...versiones].reverse().map((v) => (
              <li
                key={`${v.nombre}|${v.content_hash}`}
                className="border-b px-5 py-3 last:border-0"
                style={{ borderColor: "var(--borde)" }}
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span
                    className="w-7 shrink-0 font-mono text-xs tabular-nums"
                    style={{ color: "var(--texto-suave)" }}
                  >
                    v{v.numero}
                  </span>
                  <EtiquetaTipo tipo={v.numero === 1 ? "alta" : "edicion"} />
                  <Extension nombre={v.nombre} />
                  <span className="text-sm font-medium break-all">
                    {v.nombre}
                  </span>
                  <span className="ml-auto">
                    <Descargar url={v.url} />
                  </span>
                </div>
                <div
                  className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pl-10 text-xs"
                  style={{ color: "var(--texto-suave)" }}
                >
                  <span>{fecha(v.visto_en)}</span>
                  <span>{hace(v.visto_en)}</span>
                  <span className="tabular-nums">{pesoArchivo(v.bytes)}</span>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      )}
    </>
  );
}
