import type { Metadata } from "next";
import { Inter, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import SolanaProvider from "./components/SolanaProvider";

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
  title: "Sports Arena | Decentralized Prediction Hub",
  description: "Experience the next level of sports betting on Solana. Fast, transparent, and decentralized.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${barlow.variable}`} suppressHydrationWarning>
      <body
        className="font-sans antialiased selection:bg-kayo-green selection:text-black"
        suppressHydrationWarning
      >
        <SolanaProvider>
          {children}
        </SolanaProvider>
      </body>
    </html>
  );
}