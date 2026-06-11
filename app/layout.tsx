import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const display = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800", "900"],
});

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
    <html lang="es" className={`${display.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Nav />
        {children}
      </body>
    </html>
  );
}
