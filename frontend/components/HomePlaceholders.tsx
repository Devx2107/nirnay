export function MapPlaceholder() {
  return (
    <section aria-label="Map area" className="flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50">
      <p className="text-sm text-neutral-400">Map coming soon</p>
    </section>
  );
}

export function HospitalListPlaceholder() {
  return (
    <section aria-label="Hospital list" className="space-y-3">
      <div className="h-5 w-36 rounded bg-neutral-100" />
      <div className="rounded-2xl border border-neutral-200 p-5">
        <p className="text-sm text-neutral-400">Hospitals will appear here</p>
      </div>
    </section>
  );
}
