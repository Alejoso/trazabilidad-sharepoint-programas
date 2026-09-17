const FECHA = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

const FECHA_CORTA = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeZone: "America/Bogota",
});

export function fecha(iso: string | null, corta = false) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return (corta ? FECHA_CORTA : FECHA).format(d);
}

export function hace(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  const seg = Math.round((Date.now() - d.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
  const tramos: [Intl.RelativeTimeFormatUnit, number][] = [
    ["second", 60],
    ["minute", 60],
    ["hour", 24],
    ["day", 30],
    ["month", 12],
    ["year", Infinity],
  ];

  let valor = seg;
  for (const [unidad, paso] of tramos) {
    if (Math.abs(valor) < paso) return rtf.format(-Math.round(valor), unidad);
    valor /= paso;
  }
  return rtf.format(-Math.round(valor), "year");
}

export function pesoArchivo(bytes: number | null) {
  if (bytes === null || bytes === undefined) return "—";
  const u = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
}

/** El nombre llega del script con la extensión incluida. */
export function extension(nombre: string) {
  const punto = nombre.lastIndexOf(".");
  return punto > 0 ? nombre.slice(punto + 1).toLowerCase() : "";
}

const DIA_LOCAL = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Bogota",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Fecha AAAA-MM-DD en hora de Bogotá. Los timestamps llegan en UTC, así que
 * recortar la cadena ISO daría el día equivocado para las horas de la noche;
 * los filtros por fecha tienen que usar el mismo día que se ve en pantalla.
 */
export function diaLocal(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : DIA_LOCAL.format(d);
}
