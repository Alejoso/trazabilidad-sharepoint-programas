import Link from "next/link";

export type ValoresFiltro = {
  q: string;
  desde: string;
  hasta: string;
};

/** Lee y normaliza los filtros que viajan en la URL. */
export function leerFiltros(sp: Record<string, string | undefined>): ValoresFiltro {
  const fecha = (v: string | undefined) =>
    v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "";
  return {
    q: (sp.q ?? "").trim(),
    desde: fecha(sp.desde),
    hasta: fecha(sp.hasta),
  };
}

export function hayFiltros(f: ValoresFiltro) {
  return Boolean(f.q || f.desde || f.hasta);
}

const campo = {
  borderColor: "var(--borde)",
  background: "var(--panel)",
  color: "var(--texto)",
};

export function Filtros({
  valores,
  placeholder,
  etiquetaFecha,
  ruta,
  ocultos,
}: {
  valores: ValoresFiltro;
  placeholder: string;
  etiquetaFecha: string;
  ruta: string;
  /** Campos que el formulario debe conservar, p. ej. el tipo de evento. */
  ocultos?: Record<string, string>;
}) {
  return (
    // Formulario GET: filtra en el servidor y deja los filtros en la URL,
    // así se puede compartir el enlace ya filtrado.
    <form action={ruta} className="mb-4 space-y-3">
      {Object.entries(ocultos ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}

      <div className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={valores.q}
          placeholder={placeholder}
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
          style={campo}
        />
        <button
          type="submit"
          className="shrink-0 cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-opacity hover:opacity-70"
          style={campo}
        >
          Buscar
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
        <span style={{ color: "var(--texto-suave)" }}>{etiquetaFecha}</span>
        <label className="flex items-center gap-1.5">
          <span style={{ color: "var(--texto-suave)" }}>desde</span>
          <input
            type="date"
            name="desde"
            defaultValue={valores.desde}
            max={valores.hasta || undefined}
            className="rounded-md border px-2 py-1 outline-none focus:ring-2"
            style={campo}
          />
        </label>
        <label className="flex items-center gap-1.5">
          <span style={{ color: "var(--texto-suave)" }}>hasta</span>
          <input
            type="date"
            name="hasta"
            defaultValue={valores.hasta}
            min={valores.desde || undefined}
            className="rounded-md border px-2 py-1 outline-none focus:ring-2"
            style={campo}
          />
        </label>

        {hayFiltros(valores) ? (
          <Link
            href={ruta}
            className="underline underline-offset-2 transition-opacity hover:opacity-70"
            style={{ color: "var(--texto-suave)" }}
          >
            Limpiar filtros
          </Link>
        ) : null}
      </div>
    </form>
  );
}
