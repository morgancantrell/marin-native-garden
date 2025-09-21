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
  title: "Marin Native Garden Planner | Personalized Native Plant Recommendations",
  description: "Get personalized native plant recommendations for your Marin County property. Create a thriving native garden with local plants, seasonal photos, and water conservation rebates.",
  keywords: [
    "Marin County native plants",
    "California native garden",
    "native plant recommendations",
    "Marin County landscaping",
    "water conservation rebates",
    "native plant nursery",
    "sustainable landscaping",
    "California native species",
    "Marin County garden design",
    "native plant identification"
  ],
  authors: [{ name: "Marin Native Garden" }],
  creator: "Marin Native Garden",
  publisher: "Marin Native Garden",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://marin-native-garden.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Marin Native Garden Planner | Personalized Native Plant Recommendations",
    description: "Get personalized native plant recommendations for your Marin County property. Create a thriving native garden with local plants, seasonal photos, and water conservation rebates.",
    url: 'https://marin-native-garden.vercel.app',
    siteName: 'Marin Native Garden',
    images: [
      {
        url: '/social-card.svg',
        width: 1200,
        height: 630,
        alt: 'Marin Native Garden Planner - Personalized native plant recommendations for Marin County properties',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Marin Native Garden Planner | Personalized Native Plant Recommendations",
    description: "Get personalized native plant recommendations for your Marin County property. Create a thriving native garden with local plants, seasonal photos, and water conservation rebates.",
    images: ['/social-card.svg'],
    creator: '@marinnativegarden',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.svg', sizes: '16x16', type: 'image/svg+xml' }
    ],
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Marin Native Garden Planner",
    "description": "Get personalized native plant recommendations for your Marin County property. Create a thriving native garden with local plants, seasonal photos, and water conservation rebates.",
    "url": "https://marin-native-garden.vercel.app",
    "applicationCategory": "EnvironmentalApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "creator": {
      "@type": "Organization",
      "name": "Marin Native Garden",
      "url": "https://marin-native-garden.vercel.app"
    },
    "featureList": [
      "Personalized native plant recommendations",
      "Marin County specific plant database",
      "Seasonal plant photos",
      "Water conservation rebate information",
      "Companion plant suggestions",
      "Growth visualization tools"
    ],
    "screenshot": "https://marin-native-garden.vercel.app/social-card.svg",
    "softwareVersion": "1.0",
    "datePublished": "2024-01-01",
    "dateModified": new Date().toISOString().split('T')[0],
    "inLanguage": "en-US",
    "isAccessibleForFree": true,
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "memoryRequirements": "256MB RAM",
    "storageRequirements": "10MB",
    "permissions": "No special permissions required",
    "applicationSubCategory": "Gardening and Landscaping",
    "keywords": "Marin County native plants, California native garden, native plant recommendations, Marin County landscaping, water conservation rebates, native plant nursery, sustainable landscaping, California native species, Marin County garden design, native plant identification"
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Hidden social card image for SEO */}
        <img 
          src="/social-card.svg" 
          alt="Marin Native Garden Planner - Personalized native plant recommendations for Marin County properties featuring California native plants, seasonal photos, and water conservation rebates"
          style={{ display: 'none' }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
