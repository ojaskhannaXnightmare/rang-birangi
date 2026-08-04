import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RANG BIRANGI — Handcrafted Indian Elegance | Bangles, Earrings, Sarees & Kurtis",
  description: "RANG BIRANGI brings you authentic handcrafted Indian fashion — bangles, earrings, sarees, and kurtis — made by skilled artisans across India. Free shipping above ₹999. COD available.",
  keywords: ["RANG BIRANGI", "handmade bangles", "earrings", "sarees", "kurtis", "Indian fashion", "handcrafted jewelry", "ethnic wear"],
  authors: [{ name: "RANG BIRANGI" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RANG BIRANGI",
  },
  openGraph: {
    title: "RANG BIRANGI — Handcrafted Indian Elegance",
    description: "Authentic handcrafted Indian fashion — bangles, earrings, sarees, and kurtis.",
    siteName: "RANG BIRANGI",
    type: "website",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "RANG BIRANGI",
    description: "Handcrafted Indian Elegance",
    images: ["/logo.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#7B1E3A",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
