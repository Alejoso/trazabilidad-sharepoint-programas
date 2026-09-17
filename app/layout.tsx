import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trazabilidad de programas",
  description:
    "Historial de cambios de las filas y documentos de la lista de SharePoint.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
