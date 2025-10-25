import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PolyWhale - Polymarket Whale Trade Alert",
  description: "Real-time monitoring of large trades on Polymarket",
  icons: {
    icon: '/logoduolai.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logoduolai.png" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
