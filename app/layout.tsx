import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Pollapp — Polla Mundialera 2026",
  description: "Pronostica los partidos del Mundial 2026 y compite con tu grupo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <Nav />
        {children}
      </body>
    </html>
  );
}
