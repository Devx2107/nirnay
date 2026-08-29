"use client";

import { FormEvent, useState } from "react";
import type { ParsedIntent } from "@/lib/ai/types";

export function SearchBar({ onIntent }: { onIntent: (intent: ParsedIntent) => Promise<void> | void }) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<ParsedIntent | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = query.trim();
    if (!text || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/parse-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Intent processing failed");
      }

      setIntent(result.intent);
      await onIntent(result.intent);
      console.log("Parsed intent JSON:", result.intent);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Intent processing failed";
      console.error("Intent processing error:", message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  function updateIntent<K extends keyof ParsedIntent>(field: K, value: ParsedIntent[K]) {
    setIntent((current) => current ? { ...current, [field]: value } : current);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="emergency-search">
          Describe the emergency
        </label>
        <input
          id="emergency-search"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Describe what help you need..."
          className="h-12 min-w-0 flex-1 rounded-xl border border-neutral-300 px-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="h-12 rounded-xl bg-brand-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Processing..." : "Find care"}
        </button>
      </div>
      {intent && (
        <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50 p-4">
          <p className="text-sm font-semibold text-neutral-900">Review search details</p>
          <p className="mt-1 text-xs text-neutral-600">Adjust any parameter, then search again without using AI.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-neutral-700">Specialty
              <select value={intent.specialty ?? ""} onChange={(event) => updateIntent("specialty", event.target.value || null)} className="mt-1 h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm font-normal text-neutral-900">
                <option value="">Any specialty</option>
                {['cardiology', 'neurology', 'orthopedics', 'pediatrics', 'general_surgery', 'emergency_medicine', 'internal_medicine', 'oncology', 'obstetrics', 'gynecology', 'nephrology', 'pulmonology', 'gastroenterology', 'urology', 'dermatology', 'ophthalmology', 'ent', 'psychiatry'].map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium text-neutral-700">Blood type
              <select value={intent.blood_type ?? ""} onChange={(event) => updateIntent("blood_type", event.target.value || null)} className="mt-1 h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm font-normal text-neutral-900">
                <option value="">Not specified</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium text-neutral-700">Urgency
              <select value={intent.urgency_level ?? ""} onChange={(event) => updateIntent("urgency_level", (event.target.value || null) as ParsedIntent["urgency_level"])} className="mt-1 h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm font-normal capitalize text-neutral-900">
                <option value="">Not specified</option>
                {['low', 'medium', 'high', 'critical'].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium text-neutral-700">Bed type
              <select value={intent.bed_type ?? ""} onChange={(event) => updateIntent("bed_type", (event.target.value || null) as ParsedIntent["bed_type"])} className="mt-1 h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm font-normal text-neutral-900">
                <option value="">No bed required</option>
                <option value="icu">ICU bed</option>
                <option value="general">General bed</option>
              </select>
            </label>
            <label className="text-xs font-medium text-neutral-700">Admission required
              <select value={intent.admission_required === null ? "" : String(intent.admission_required)} onChange={(event) => updateIntent("admission_required", event.target.value === "" ? null : event.target.value === "true")} className="mt-1 h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm font-normal text-neutral-900">
                <option value="">Not specified</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </label>
            <label className="text-xs font-medium text-neutral-700">Blood required
              <select value={intent.blood_required === null ? "" : String(intent.blood_required)} onChange={(event) => updateIntent("blood_required", event.target.value === "" ? null : event.target.value === "true")} className="mt-1 h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm font-normal text-neutral-900">
                <option value="">Not specified</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </label>
          </div>
          <button type="button" onClick={() => void onIntent(intent)} className="mt-4 h-10 rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700">
            Search with these parameters
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-brand-600">{error}</p>}
    </form>
  );
}
