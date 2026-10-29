"use client";

import { Search } from "lucide-react";
import { normaliseSearch } from "@/lib/search-normalise";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function applyFilter(input: HTMLInputElement) {
  const panel = input.closest("[data-campaign-offer-panel]");
  if (!(panel instanceof HTMLElement)) return;
  const query = normaliseSearch(input.value);
  const cards = panel.querySelectorAll<HTMLElement>("[data-campaign-offer-card]");
  let shown = 0;
  cards.forEach((card) => {
    const arabic = card.getAttribute("data-name-ar") ?? "";
    const english = card.getAttribute("data-name-en") ?? "";
    const matched = query.length === 0 || arabic.includes(query) || english.includes(query);
    card.hidden = !matched;
    if (matched) shown += 1;
  });
  const grid = panel.querySelector<HTMLElement>("[data-campaign-offer-grid]");
  const missed = panel.querySelector<HTMLElement>("[data-no-matches]");
  const none = query.length > 0 && shown === 0;
  if (grid) grid.hidden = none;
  if (missed) missed.hidden = !none;
}

export function SearchField({ placeholder, noMatches }: { placeholder: string; noMatches: string }) {
  return (
    <div className="mb-5">
      <label className="relative block">
        <span className="sr-only">{placeholder}</span>
        <Search
          className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder={placeholder}
          onInput={(event) => applyFilter(event.currentTarget)}
          className={`w-full rounded-button border border-border bg-bg py-3 ps-11 pe-4 text-sm text-dark ${focusRing}`}
        />
      </label>
      <p hidden data-no-matches className="mt-4 text-base text-dark">
        {noMatches}
      </p>
    </div>
  );
}
