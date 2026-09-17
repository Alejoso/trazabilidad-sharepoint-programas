import Link from "next/link";
import { extension } from "@/lib/format";

export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border ${className}`}
      style={{ borderColor: "var(--borde)", background: "var(--panel)" }}
    >
      {children}
    </div>
  );
}

export function Titulo({
  children,
  sub,
}: {
  children: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight">{children}</h1>
      {sub ? (
        <p className="mt-1 text-sm" style={{ color: "var(--texto-suave)" }}>
          {sub}
        </p>
      ) : null}
    </div>
  );
}

export function Estadistica({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: React.ReactNode;
}) {
  return (
    <Panel className="px-4 py-3">
      <div
        className="text-xs uppercase tracking-wide"
        style={{ color: "var(--texto-suave)" }}
      >
        {etiqueta}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{valor}</div>
    </Panel>
  );
}

export function EtiquetaTipo({ tipo }: { tipo: "alta" | "edicion" }) {
  const alta = tipo === "alta";
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{
        color: alta ? "var(--alta)" : "var(--edicion)",
        background: alta ? "var(--alta-suave)" : "var(--edicion-suave)",
      }}
    >
      {alta ? "Primera versión" : "Edición"}
    </span>
  );
}

export function Extension({ nombre }: { nombre: string }) {
  const ext = extension(nombre);
  if (!ext) return null;
  return (
    <span
      className="inline-flex shrink-0 items-center rounded px-1.5 py-0.5 font-mono text-[10px] uppercase"
      style={{ background: "var(--panel-alt)", color: "var(--texto-suave)" }}
    >
      {ext}
    </span>
  );
}

export function Descargar({ url }: { url: string | null }) {
  if (!url) {
    return (
      <span className="text-xs" style={{ color: "var(--texto-suave)" }}>
        sin enlace
      </span>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs font-medium underline underline-offset-2 transition-opacity hover:opacity-70"
      style={{ color: "var(--acento)" }}
    >
      Descargar
    </a>
  );
}

export function Vacio({ children }: { children: React.ReactNode }) {
  return (
    <Panel className="px-6 py-12 text-center">
      <p className="text-sm" style={{ color: "var(--texto-suave)" }}>
        {children}
      </p>
    </Panel>
  );
}

export function ErrorDatos({ mensaje }: { mensaje: string }) {
  return (
    <Panel className="px-6 py-8">
      <h2 className="text-sm font-semibold">No se pudieron cargar los datos</h2>
      <p className="mt-2 text-sm" style={{ color: "var(--texto-suave)" }}>
        {mensaje}
      </p>
      <p className="mt-4 text-xs" style={{ color: "var(--texto-suave)" }}>
        Revisa que <code className="font-mono">SUPABASE_URL</code> y{" "}
        <code className="font-mono">SUPABASE_KEY</code> estén configuradas y que
        las políticas de la tabla permitan la lectura.
      </p>
    </Panel>
  );
}

export function EnlaceFila({
  spId,
  programa,
}: {
  spId: number;
  programa: string | null;
}) {
  return (
    <Link
      href={`/programa/${spId}`}
      className="enlace-programa font-medium underline underline-offset-2"
    >
      {programa || "Sin título"}
    </Link>
  );
}

/** Segundo destino al mismo sitio, al final de la fila, para dar dónde pulsar. */
export function IrAlPrograma({
  spId,
  programa,
}: {
  spId: number;
  programa: string | null;
}) {
  return (
    <Link
      href={`/programa/${spId}`}
      aria-label={`Ver el historial de ${programa || `sp_id ${spId}`}`}
      className="ir-a-programa inline-flex h-7 w-7 items-center justify-center rounded-full border"
      style={{ borderColor: "var(--borde)", color: "var(--acento)" }}
    >
      <svg
        viewBox="0 0 16 16"
        width="13"
        height="13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 3.5 10.5 8 6 12.5" />
      </svg>
    </Link>
  );
}
