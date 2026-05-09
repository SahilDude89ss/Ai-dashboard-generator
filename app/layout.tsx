import type { Metadata } from "next";
import { Syne, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dashcraft — AI SQL Dashboard Builder",
  description: "Describe it. Claude writes the SQL.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${jetbrainsMono.variable}`}>
      <body>
        {children}
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: "var(--s1)",
              border: "1px solid var(--border2)",
              color: "var(--text)",
              fontFamily: "var(--font-syne)",
            },
          }}
        />
      </body>
    </html>
  );
}
