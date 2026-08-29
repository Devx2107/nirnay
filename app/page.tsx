import { HospitalListPlaceholder, MapPlaceholder } from "@/components/HomePlaceholders";
import { SearchBar } from "@/components/SearchBar";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
      <section className="max-w-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Find care faster</p>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-950 sm:text-5xl">Find the right hospital when it matters.</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-neutral-500">Tell us what you need and we&apos;ll help you find nearby care.</p>
        <div className="mt-8">
          <SearchBar />
        </div>
      </section>
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <MapPlaceholder />
        <HospitalListPlaceholder />
      </div>
    </main>
  );
}
