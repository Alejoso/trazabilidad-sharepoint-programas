export type Fila = {
  sp_id: number;
  programa: string | null;
  creado_por: string | null;
  creado_en: string | null;
  modificado_por: string | null;
  actualizado_en: string | null;
};

export type Contenido = {
  content_hash: string;
  url: string | null;
  bytes: number | null;
  primera_vez: string | null;
};

export type DocumentoVisto = {
  sp_id: number;
  nombre: string;
  content_hash: string;
  visto_en: string;
};

/** Una versión de la fila: el documento que se vio y cuándo. */
export type Version = {
  nombre: string;
  content_hash: string;
  visto_en: string;
  url: string | null;
  bytes: number | null;
  /** 1 = primera versión de la fila, 2 en adelante = ediciones. */
  numero: number;
};

/** Una versión situada en la línea de tiempo global, con los datos de su fila. */
export type Evento = Version & {
  sp_id: number;
  programa: string | null;
  /** Viene de la fila, no del documento: es quien tocó el programa por última vez. */
  modificado_por: string | null;
  tipo: "alta" | "edicion";
};
