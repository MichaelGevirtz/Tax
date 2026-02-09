import type { Metadata } from "next";
import { Noto_Sans_Hebrew } from "next/font/google";
import "./globals.css";

const notoSansHebrew = Noto_Sans_Hebrew({
  subsets: ["hebrew", "latin"],
  weight: ["400", "600"],
  variable: "--font-hebrew",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TaxBack — בדיקת החזר מס לשכירים",
  description:
    "בדיקה מהירה על סמך טופס 106 — האם כדאי לך להגיש בקשה להחזר מס?",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={notoSansHebrew.className}>{children}</body>
    </html>
  );
}
