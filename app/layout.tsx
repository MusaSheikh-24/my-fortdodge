import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PageLoader from "./components/PageLoader";
import {
  generateMetadata as generateSEOMetadata,
} from "@/lib/seo";
import StructuredData from "./components/StructuredData";
import { ToastProvider } from "./components/Toaster";
// Validate environment variables on app startup
import "@/lib/validate-env";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  ...generateSEOMetadata({
    title: "Home",
    description:
      "Fort Dodge Islamic Center - Serving the Muslim community in Fort Dodge, Iowa with daily prayers, Friday prayers, Islamic education, community services, and spiritual guidance.",
    keywords: [
      "Fort Dodge masjid",
      "Islamic center",
      "Muslim community",
      "prayer times",
      "Friday prayer",
      "Islamic school",
      "community services",
    ],
  }),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fort Dodge Islamic Center",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#075985",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider>
          <StructuredData />
          <PageLoader />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
