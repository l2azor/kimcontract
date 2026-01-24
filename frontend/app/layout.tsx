import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4001';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "계약왕김계약 - 블록체인 전자 근로계약서",
  description: "솔라나 블록체인 기반 안전한 전자 근로계약서 서비스. 간편한 서명으로 위변조 방지 보장",
  openGraph: {
    title: "계약왕김계약",
    description: "블록체인으로 안전하게 보관되는 전자 근로계약서",
    type: "website",
    locale: "ko_KR",
    siteName: "계약왕김계약",
    url: siteUrl,
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "계약왕김계약 - 블록체인 전자 근로계약서",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "계약왕김계약",
    description: "블록체인으로 안전하게 보관되는 전자 근로계약서",
    images: [`${siteUrl}/og-image.png`],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
