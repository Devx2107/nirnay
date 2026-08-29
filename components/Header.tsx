import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="text-lg font-bold tracking-tight text-neutral-950">
          Nirnay<span className="text-brand-500">.</span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-5 text-sm font-medium text-neutral-600">
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
