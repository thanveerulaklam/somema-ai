import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google';
import { AnalyticsProvider } from '../components/analytics/AnalyticsProvider';
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
  title: "Quely.ai - AI-Powered Social Media Manager",
  description: "Automate your social media content creation and posting with AI. Generate captions, hashtags, and images for Instagram, Facebook, and Twitter.",
  keywords: ["social media", "AI", "content creation", "automation", "marketing"],
  authors: [{ name: "Quely.ai" }],
  icons: {
    icon: '/quely_favicon.png',
    shortcut: '/quely_favicon.png',
    apple: '/quely_favicon.png',
  }
};

export const viewport = "width=device-width, initial-scale=1";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/quely_favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/quely_favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/quely_favicon.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AnalyticsProvider>
          {children}
        </AnalyticsProvider>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
        )}
      </body>
    </html>
  );
}
