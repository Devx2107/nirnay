export function SearchBar() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <label className="sr-only" htmlFor="emergency-search">
        Describe the emergency
      </label>
      <input
        id="emergency-search"
        type="text"
        placeholder="Describe what help you need..."
        className="h-12 min-w-0 flex-1 rounded-xl border border-neutral-300 px-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />
      <button type="button" className="h-12 rounded-xl bg-brand-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-600">
        Find care
      </button>
    </div>
  );
}
