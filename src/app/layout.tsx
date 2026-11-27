import "./globals.css";
import Link from "next/link";
import { Balon } from "./ilustraciones";

export const metadata = { title: "Reserva de canchas" };

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
            <nav aria-label="Principal">
              <Link href="/">Reservar</Link>
              <Link href="/cancelar">Mi reserva</Link>
              <Link href="/admin">Administración</Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="pie-sitio">Fulbito y vóley · Reserva en línea, sin llamadas ni mensajes</footer>
      </body>
    </html>
  );
}
