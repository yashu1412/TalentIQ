import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/ThemeProvider";

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Talent-IQ Career Copilot",
  description: "AI-powered career coaching and interview preparation platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="font-sans min-h-full flex flex-col">
        <ThemeProvider>
          <ClerkProvider>{children}</ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
