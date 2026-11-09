import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CHITTI NAIDU RUN – The Great CM Escape",
  description:
    "A fictional, humorous pixel-art endless runner. Help Chitti Naidu dodge traffic, fix potholes and survive the no-confidence motion!",
  applicationName: "Chitti Naidu Run",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: "CHITTI NAIDU RUN – The Great CM Escape",
    description: "Dodge potholes, clear traffic, keep your CM Power. A fictional political-satire runner.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1b1020",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
