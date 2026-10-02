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
  title: "SuperAdminTheBottleClub",
  description: "The Bottle Club - Super Admin & POS Management System",
  icons: {
    icon: [
      { url: "/thebottleclub.png", type: "image/png" },
      { url: "/thebottleclub.jpg", type: "image/jpeg" },
    ],
    shortcut: "/thebottleclub.png",
    apple: "/thebottleclub.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
