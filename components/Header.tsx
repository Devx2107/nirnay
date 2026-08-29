import { Yatra_One } from "next/font/google";
import Link from "next/link";

const yatraOne = Yatra_One({
  weight: "400",
  subsets: ["devanagari", "latin"],
});

export function Header() {
  return (
    <header className="fixed top-4 left-0 right-0 z-50 mx-auto max-w-5xl px-4">
      <div className="flex h-16 items-center justify-between rounded-full border border-neutral-200/50 bg-white/80 px-6 shadow-sm backdrop-blur-md">
        <Link href="/" className={`text-4xl tracking-tight text-neutral-950 flex items-center pt-2 ${yatraOne.className}`}>
          निर्णय<span className="text-brand-500 text-3xl">.</span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-6 text-sm font-medium text-neutral-600">
          <Link className="transition-colors hover:text-brand-600" href="/">
            Home
          </Link>
          <Link className="transition-colors hover:text-brand-600" href="/admin">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
