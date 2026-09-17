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

/** Una versión concreta de un documento: el contenido más cuándo se vio. */
export type Version = {
  content_hash: string;
  visto_en: string;
  url: string | null;
  bytes: number | null;
  /** 1 = versión original, 2 = primera edición, etc. */
  numero: number;
};

/** Un documento (por nombre) dentro de una fila, con todas sus versiones. */
export type Documento = {
  nombre: string;
  versiones: Version[];
  /** visto_en de la versión más reciente. */
  ultimoCambio: string;
};

/** Un evento del historial: alta o edición de un documento. */
export type Evento = {
  sp_id: number;
  programa: string | null;
  nombre: string;
  content_hash: string;
  visto_en: string;
  url: string | null;
  bytes: number | null;
  numero: number;
  tipo: "alta" | "edicion";
};
