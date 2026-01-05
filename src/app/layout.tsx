import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Suspense } from "react";
import { LoadingSkeleton } from "@/components/shared/states/LoadingSkeleton";
import { FloatingAdminButton } from "@/components/layout/FloatingAdminButton";
import {
  APP_DESCRIPTION,
  APP_NAME,
  FAVICON,
  LOGO,
  OG_IMAGE,
} from "@/lib/config";

const headingFont = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const bodyFont = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  icons: {
    icon: [
      { url: FAVICON },
      { url: LOGO["192"], sizes: "192x192", type: "image/png" },
      { url: LOGO["512"], sizes: "512x512", type: "image/png" },
    ],
  },
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [{ url: OG_IMAGE }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${headingFont.variable} ${bodyFont.variable} antialiased`}
      >
        <Providers>
          <Suspense fallback={<LoadingSkeleton />}>{children}</Suspense>
          <FloatingAdminButton />
        </Providers>
      </body>
    </html>
  );
}

