import React, { useState, useMemo, useEffect } from "react";
import { vendorTypeLabel, rememberBrowseList, applyScrollRestore, loadTabState, saveTabState, nextOccurrence } from "../utils";
import type { Organizer, Vendor, Market } from "../types";
import MarketCard from "./MarketCard";
import VendorCard from "./VendorCard";
import { SearchIcon, XIcon } from "./Icons";

const PAGE_SIZE = 24; // divisible by 2, 3 and 4 so grid rows come out full

// Markets are the events people go to (T128); organizers only give a market
// its logo and make it findable by the organizer's name.
type BrowsePageProps = {
  onSelect: (id: string) => void;
  onBack: () => void;
  onSwitchMode: () => void;
} & (
  | { mode: "markets"; markets: Market[]; organizers: Organizer[] }
  | { mode: "vendors"; vendors: Vendor[] }
);

type Item = { id: string; name: string; description?: string; searchText: string };

const fuzzyMatch = (term: string, text: string | undefined) => {
  if (!text) return false;
  const words = term.toLowerCase().split(" ").filter(Boolean);
  const target = text.toLowerCase();
  return words.every((w) => target.includes(w));
};

const BrowsePage: React.FC<BrowsePageProps> = (props) => {
  const { mode, onSelect, onBack, onSwitchMode } = props;
  const organizerById = useMemo(
    () => new Map((props.mode === "markets" ? props.organizers : []).map(o => [o.id, o])),
    [props]
  );
  // Markets soonest first (ones with no dates yet last, by name); vendors by name
  const items: Item[] = useMemo(() => {
    if (props.mode === "markets") {
      return props.markets
        .map(m => ({ m, next: nextOccurrence(m)?.date ?? "9999" }))
        .sort((a, b) => a.next.localeCompare(b.next) || a.m.name.localeCompare(b.m.name))
        .map(({ m }) => ({
          id: m.id,
          name: m.name,
          description: m.description,
          searchText: [m.name, m.description, m.location?.city, m.location?.venueName, (m.marketType ?? []).join(" "),
            m.organizerId ? organizerById.get(m.organizerId)?.name : ""].join(" "),
        }));
    }
    return props.vendors.map(v => ({
      id: v.id, name: v.name, description: v.description,
      searchText: `${v.name} ${v.description} ${vendorTypeLabel(v)}`,
    }));
  }, [props, organizerById]);
  const marketById = useMemo(() => new Map((props.mode === "markets" ? props.markets : []).map(m => [m.id, m])), [props]);
  const vendorById = useMemo(() => new Map((props.mode === "vendors" ? props.vendors : []).map(v => [v.id, v])), [props]);
  // Kept for this browser tab, so coming back from a profile shows the same
  // filtered list, loaded as far as before (T118)
  const stateKey = `vim-browse-page-${mode}`;
  const [saved] = useState(() => loadTabState(stateKey, { filterTerm: "", visibleCount: PAGE_SIZE }));
  const [filterTerm, setFilterTerm] = useState(saved.filterTerm);
  const [visibleCount, setVisibleCount] = useState(saved.visibleCount);
  useEffect(() => { saveTabState(stateKey, { filterTerm, visibleCount }); }, [stateKey, filterTerm, visibleCount]);
  useEffect(() => { if (items.length > 0) applyScrollRestore(); }, [items.length]);

  const title = mode === "markets" ? "All Markets" : "All Vendors";
  const noun  = mode === "markets" ? "markets" : "vendors";

  const filtered = useMemo(() => {
    if (!filterTerm.trim()) return items;
    return items.filter((item) => fuzzyMatch(filterTerm, item.searchText));
  }, [items, filterTerm]);

  const visible = filtered.slice(0, visibleCount);

  // Opening a profile remembers this list for Previous / Next (T118)
  const openFromList = (id: string) => {
    rememberBrowseList(
      mode,
      filtered.map((i) => i.id),
      filterTerm.trim() ? `Back to ${noun}: "${filterTerm.trim()}"` : `Back to all ${noun}`
    );
    onSelect(id);
  };
  const hasMore = visibleCount < filtered.length;

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterTerm(e.target.value);
    setVisibleCount(PAGE_SIZE); // reset pagination when filter changes
  };

  const clearFilter = () => {
    setFilterTerm("");
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <main>
      {/* Page header — sticky so the search bar stays visible while scrolling */}
      <div className="sticky top-0 z-10 bg-brand-blue text-white py-6 px-4 shadow-md">
        <div className="container mx-auto max-w-6xl">
          {/* Top row: back link left, switch-mode link right */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="text-brand-light-blue hover:text-white text-sm inline-flex items-center gap-1 transition-colors py-3 px-1 min-h-[3rem]"
            >
              ← Back to home
            </button>
            <button
              onClick={onSwitchMode}
              className="text-sm px-4 py-3 rounded-full border border-white/40 text-white hover:bg-white/10 transition-colors min-h-[3rem]"
            >
              {mode === "markets" ? "See all vendors →" : "See all markets →"}
            </button>
          </div>

          <h1 className="text-3xl font-extrabold font-serif mb-4">{title}</h1>

          {/* Search / filter input */}
          <div className="relative max-w-md">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              aria-label={`Search ${noun}`}
              placeholder={mode === "markets" ? "Search markets by name, town, type or organizer…" : "Search vendors by name, description, or category…"}
              value={filterTerm}
              onChange={handleFilterChange}
              className="w-full pl-10 pr-10 py-2.5 rounded-full text-gray-900 text-sm focus:outline-none focus:ring-4 focus:ring-brand-gold border-0"
            />
            {filterTerm && (
              <button
                onClick={clearFilter}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <XIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Count */}
        <p className="text-sm text-gray-500 mb-6">
          Showing {Math.min(visibleCount, filtered.length)} of {filtered.length}{" "}
          {noun}
          {filterTerm && ` matching "${filterTerm}"`}
        </p>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg font-medium mb-2">No {noun} matched your search.</p>
            <button
              onClick={clearFilter}
              className="mt-2 text-brand-blue hover:underline text-sm"
            >
              Clear filter
            </button>
          </div>
        ) : mode === "markets" ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {visible.map(({ id }) => {
              const market = marketById.get(id)!;
              return (
                <MarketCard
                  key={id}
                  market={market}
                  organizer={market.organizerId ? organizerById.get(market.organizerId) : undefined}
                  onSelect={openFromList}
                />
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {visible.map(({ id }) => (
              <VendorCard
                key={id}
                vendor={vendorById.get(id)!}
                onSelect={openFromList}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="mt-10 text-center">
            <button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="px-8 py-3 rounded-full border-2 border-brand-blue text-brand-blue font-semibold hover:bg-brand-blue hover:text-white transition-colors min-h-[3rem]"
            >
              Load more {noun}
            </button>
          </div>
        )}
      </div>
    </main>
  );
};

export default BrowsePage;
