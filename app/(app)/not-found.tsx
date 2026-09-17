import Link from "next/link";
import { Vacio } from "@/components/ui";

export default function NoEncontrado() {
  return (
    <Vacio>
      No encontramos ese programa.{" "}
      <Link
        href="/"
        className="underline underline-offset-2"
        style={{ color: "var(--acento)" }}
      >
        Volver al listado
      </Link>
      .
    </Vacio>
  );
}
