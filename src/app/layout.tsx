import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brevete Perú",
  description: "Preparación gratuita para el examen de conocimientos MTC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
