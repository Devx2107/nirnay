"use client";

import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[360px] w-full items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50">
      <p className="text-sm text-neutral-400">Loading map...</p>
    </div>
  ),
});

export default MapComponent;
