import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Nirnay | Find the right hospital",
  description: "A faster way to find nearby hospitals with the care you need.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${plusJakartaSans.className} antialiased`}>
        <Header />
        <main className="pt-28">
          {children}
        </main>
      </body>
    </html>
  );
}
