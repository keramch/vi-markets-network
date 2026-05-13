import React, { useState, useMemo } from "react";
import type { Market, Vendor } from "../types";
import MarketCard from "./MarketCard";
import VendorCard from "./VendorCard";
import { SearchIcon, XIcon } from "./Icons";

const PAGE_SIZE = 12;

interface BrowsePageProps {
  mode: "markets" | "vendors";
  items: Market[] | Vendor[];
  onSelect: (id: string) => void;
  onBack: () => void;
  onSwitchMode: () => void;
}

const fuzzyMatch = (term: string, text: string) => {
  const words = term.toLowerCase().split(" ").filter(Boolean);
  const target = text.toLowerCase();
  return words.every((w) => target.includes(w));
};

const BrowsePage: React.FC<BrowsePageProps> = ({
  mode,
  items,
  onSelect,
  onBack,
  onSwitchMode,
}) => {
  const [filterTerm, setFilterTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const title = mode === "markets" ? "All Markets" : "All Vendors";
  const noun  = mode === "markets" ? "markets" : "vendors";

  const filtered = useMemo(() => {
    if (!filterTerm.trim()) return items;
    return items.filter((item) =>
      fuzzyMatch(
        filterTerm,
        `${item.name} ${item.description} ${item.category}`
      )
    );
  }, [items, filterTerm]);

  const visible = filtered.slice(0, visibleCount);
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
              placeholder={`Search ${noun} by name, description, or category…`}
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
            {(visible as Market[]).map((market) => (
              <MarketCard
                key={market.id}
                market={market}
                onSelect={onSelect}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {(visible as Vendor[]).map((vendor) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                onSelect={onSelect}
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
