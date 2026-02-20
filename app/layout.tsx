import "./globals.css";
import type { Metadata } from "next";
import { APP_STRINGS } from "@/src/strings";

export const metadata: Metadata = {
  title: APP_STRINGS.metadata.title,
  description: APP_STRINGS.metadata.description
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
