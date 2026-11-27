"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ENLACES = [
  { href: "/", texto: "Reservar" },
  { href: "/cancelar", texto: "Mi reserva" },
  { href: "/admin", texto: "Administración" },
];

export function Navegacion() {
  const ruta = usePathname();
  return (
    <nav aria-label="Principal">
      {ENLACES.map((e) => (
        <Link key={e.href} href={e.href} aria-current={ruta === e.href ? "page" : undefined}>
          {e.texto}
        </Link>
      ))}
    </nav>
  );
}
