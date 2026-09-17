export function Buscador({
  valor,
  placeholder,
}: {
  valor: string;
  placeholder: string;
}) {
  // Formulario GET: filtra en el servidor y deja la búsqueda en la URL,
  // así se puede compartir el enlace ya filtrado.
  return (
    <form className="mb-4 flex gap-2">
      <input
        type="search"
        name="q"
        defaultValue={valor}
        placeholder={placeholder}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
        style={{
          borderColor: "var(--borde)",
          background: "var(--panel)",
          color: "var(--texto)",
        }}
      />
      <button
        type="submit"
        className="shrink-0 cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-opacity hover:opacity-70"
        style={{ borderColor: "var(--borde)", background: "var(--panel)" }}
      >
        Buscar
      </button>
    </form>
  );
}
