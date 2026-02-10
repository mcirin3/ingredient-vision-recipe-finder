import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Ingredient Vision Recipe Finder",
  description: "Take a photo of your ingredients and get recipe recommendations powered by AI vision",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gradient-to-b from-white to-gray-50 text-gray-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}

