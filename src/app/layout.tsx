import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Consulta de Legajo | CELTA",
  description: "Consulta interna de personas, DNI y CUIT de CELTA.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es-AR"><body>{children}</body></html>;
}
