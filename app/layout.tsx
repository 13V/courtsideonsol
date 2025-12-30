import type { Metadata } from "next";
import { Inter, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import SolanaProvider from "./components/SolanaProvider";
import Polyfill from "./components/Polyfill";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const barlow = Barlow_Condensed({
  variable: "--font-display",
  weight: ["400", "700", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PolyPredict",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${barlow.variable}`} suppressHydrationWarning>
      <body
        className="font-sans antialiased selection:bg-[#FF6B00] selection:text-black"
        suppressHydrationWarning
      >
        <SolanaProvider>
          <Polyfill />
          {children}
        </SolanaProvider>
      </body>
    </html>
  );
}