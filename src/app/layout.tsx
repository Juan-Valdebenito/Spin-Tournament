import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import SearchBar from "@/components/SearchBar";
import ThemeToggle from "@/components/ThemeToggle";
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
  title: "Spin Tournament",
  description: "Organiza torneos de tenis de mesa con llaves de eliminacion directa",
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <div className="flex min-h-screen flex-col md:flex-row">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="hidden items-center justify-between gap-4 border-b border-border bg-surface px-6 py-3 md:flex">
              <Suspense fallback={<div className="h-9 w-full max-w-sm" />}>
                <SearchBar />
              </Suspense>
              <ThemeToggle />
            </header>
            <main className="flex-1 px-4 py-6 sm:px-6 md:py-8">{children}</main>
            <footer className="border-t border-border px-6 py-5 text-center text-xs text-muted">
              Spin Tournament — llaves de eliminacion directa para tenis de mesa
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
