import type { Metadata, Viewport } from "next";
import { Archivo, Figtree } from "next/font/google";
import "./globals.css";

const display = Archivo({ subsets: ["latin"], variable: "--font-display", axes: ["wdth"] });
const body = Figtree({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "CarryGo · Move anything from Ikorodu to anywhere in Lagos",
  description: "Book a Suzuki Carry mini truck for household items, furniture and goods. Instant quotes, trusted drivers, Ikorodu hub.",
};

export const viewport: Viewport = { themeColor: "#0f4a35" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-NG" className={`${display.variable} ${body.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
