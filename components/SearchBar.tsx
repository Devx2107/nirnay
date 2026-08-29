"use client";

import { FormEvent, useState } from "react";
import type { FollowUp, ParsedIntent } from "@/lib/ai/types";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<ParsedIntent | null>(null);
  const [followUp, setFollowUp] = useState<FollowUp | null>(null);
  const [followUpValue, setFollowUpValue] = useState("");

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
      setFollowUp(result.follow_up);
      setFollowUpValue("");
      console.log("Parsed intent JSON:", result.intent);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Intent processing failed";
      console.error("Intent processing error:", message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  function applyFollowUp() {
    if (!intent || !followUp || !followUpValue) return;
    const updatedIntent = { ...intent, [followUp.field]: followUpValue } as ParsedIntent;
    setIntent(updatedIntent);
    setFollowUp(null);
    setFollowUpValue("");
    console.log("Intent JSON after follow-up:", updatedIntent);
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
      {followUp && (
        <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50 p-4">
          <label htmlFor="intent-follow-up" className="block text-sm font-medium text-neutral-800">
            {followUp.question}
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <select
              id="intent-follow-up"
              value={followUpValue}
              onChange={(event) => setFollowUpValue(event.target.value)}
              className="h-11 flex-1 rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="">Select an option</option>
              {followUp.options.map((option) => (
                <option key={option} value={option}>
                  {option === "icu" ? "ICU bed" : option === "general" ? "General bed" : option}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={applyFollowUp}
              disabled={!followUpValue}
              className="h-11 rounded-lg border border-brand-500 px-5 text-sm font-semibold text-brand-600 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apply detail
            </button>
          </div>
        </div>
      )}
      {intent && !followUp && (
        <pre className="mt-4 overflow-x-auto rounded-xl bg-neutral-950 p-4 text-xs leading-6 text-neutral-100">
          {JSON.stringify(intent, null, 2)}
        </pre>
      )}
      {error && <p className="mt-2 text-sm text-brand-600">{error}</p>}
    </form>
  );
}
