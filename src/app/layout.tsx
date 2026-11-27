import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";
import { Balon } from "./ilustraciones";
import { Navegacion } from "./navegacion";

export const metadata: Metadata = { title: "Reserva de canchas" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="cabecera">
          <div className="cabecera-interior">
            <Link href="/" className="marca">
              <Balon />
              <span>Reserva de canchas</span>
            </Link>
            <Navegacion />
          </div>
        </header>
        {children}
        <footer className="pie-sitio">Fulbito y vóley · Reserva en línea, sin llamadas ni mensajes</footer>
      </body>
    </html>
  );
}
