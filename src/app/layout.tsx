import type { Metadata } from "next";
import {
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Newsreader,
} from "next/font/google";
import { Providers } from "@/components/providers";
import { getMetadataBase } from "@/lib/site";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: "flippinCalendar — AI front desk for modern teams",
    template: "%s · flippinCalendar",
  },
  description:
    "Run bookings, customer conversations, and a text-and-audio web concierge for your business.",
  applicationName: "flippinCalendar",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_ZA",
    siteName: "flippinCalendar",
    title: "flippinCalendar — AI front desk for modern teams",
    description:
      "Run bookings, customer conversations, and a text-and-audio web concierge for your business.",
  },
  twitter: {
    card: "summary_large_image",
    title: "flippinCalendar — AI front desk for modern teams",
    description:
      "Run bookings, customer conversations, and a text-and-audio web concierge for your business.",
  },
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plexSans.variable} ${plexMono.variable} ${newsreader.variable}`}
    >
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
