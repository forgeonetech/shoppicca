import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shoppicca - Create Your Beautiful Online Store",
  description: "Shoppicca helps entrepreneurs and small businesses launch professional e-commerce stores with zero technical skills. Get discovered, sell more, and grow your business.",
  keywords: ["e-commerce", "online store", "Ghana", "Africa", "small business", "entrepreneur"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
