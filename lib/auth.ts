export const COOKIE = "tsp_sesion";

/**
 * El valor de la cookie es un hash de la contraseña con una sal fija, para no
 * guardarla en claro en el navegador. Se calcula con Web Crypto porque el
 * middleware también lo necesita y allí no hay `node:crypto`.
 */
export async function tokenDeSesion(password: string) {
  const datos = new TextEncoder().encode(`${password}::trazabilidad-sp/v1`);
  const buf = await crypto.subtle.digest("SHA-256", datos);
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Comparación en tiempo constante para no filtrar el token por temporización. */
export function iguales(a: string, b: string) {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

export async function cookieValida(valor: string | undefined) {
  const password = process.env.APP_PASSWORD;
  if (!password || !valor) return false;
  return iguales(valor, await tokenDeSesion(password));
}
