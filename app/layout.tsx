import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MacroScout Agent Console",
  description: "Financial Research Agent Console for FairFetch token and receipt flows"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
