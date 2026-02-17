import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KasKita - Sistem Pembayaran Kas Kelas",
  description: "Aplikasi manajemen pembayaran kas kelas untuk mahasiswa Keperawatan. Mudah, cepat, dan transparan.",
  keywords: ["KasKita", "Kas Kelas", "Pembayaran", "Mahasiswa", "Keperawatan"],
  authors: [{ name: "KasKita Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "KasKita - Sistem Pembayaran Kas Kelas",
    description: "Aplikasi manajemen pembayaran kas kelas untuk mahasiswa",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
