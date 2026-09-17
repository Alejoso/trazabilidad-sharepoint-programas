import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, cookieValida } from "@/lib/auth";
import { entrar } from "./actions";

export const metadata = { title: "Entrar · Trazabilidad" };

const ERRORES: Record<string, string> = {
  clave: "Contraseña incorrecta.",
  config: "La app no tiene APP_PASSWORD configurada.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ destino?: string; error?: string }>;
}) {
  const { destino, error } = await searchParams;
  const seguro = destino?.startsWith("/") && !destino.startsWith("//") ? destino : "/";

  if (await cookieValida((await cookies()).get(COOKIE)?.value)) redirect(seguro);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="text-xl font-semibold tracking-tight">
        Trazabilidad de programas
      </h1>
      <p className="mt-1 text-sm" style={{ color: "var(--texto-suave)" }}>
        Introduce la contraseña compartida para ver el historial.
      </p>

      <form action={entrar} className="mt-6 space-y-3">
        <input type="hidden" name="destino" value={seguro} />
        <input
          type="password"
          name="password"
          autoFocus
          required
          autoComplete="current-password"
          placeholder="Contraseña"
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
          style={{
            borderColor: "var(--borde-fuerte)",
            background: "var(--panel)",
            color: "var(--texto)",
          }}
        />
        <button
          type="submit"
          className="w-full cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--acento)" }}
        >
          Entrar
        </button>
      </form>

      {error ? (
        <p className="mt-3 text-sm" style={{ color: "var(--edicion)" }}>
          {ERRORES[error] ?? "No se pudo iniciar sesión."}
        </p>
      ) : null}
    </main>
  );
}
