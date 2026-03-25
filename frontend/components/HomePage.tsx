import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import type {
  Market,
  Vendor,
  Coordinates,
  MarketCategory,
  VendorCategory,
  Review,
  VendorTag,
} from "../types";
import { MarketCategories, VendorCategoriesByType } from "../types";
import MarketCard from "./MarketCard";
import VendorCard from "./VendorCard";
import { SearchIcon, MapPinIcon, FilterIcon, XIcon } from "./Icons";
import { getDistance } from "../utils";

interface HomePageProps {
  markets: Market[];
  vendors: Vendor[];
  onSelectMarket: (id: string) => void;
  onSelectVendor: (id: string) => void;
  onViewAllMarkets: () => void;
  onViewAllVendors: () => void;
}

interface SearchableMarket extends Market {
  distance?: number;
}
interface SearchableVendor extends Vendor {
  distance?: number;
}

// --- helpers ---

const fuzzySearch = (term: string, text: string) => {
  const searchWords = term.toLowerCase().split(" ").filter((w) => w);
  const targetText = text.toLowerCase();
  return searchWords.every((word) => targetText.includes(word));
};

const noResultsMessages = [
  "🥕 No matches found — maybe try 'bread' instead of 'sourdough'?",
  "🌾 Nothing sprouting here yet! Try widening your search.",
  "🧺 Empty basket! Maybe your next favorite is setting up soon.",
  "🐝 Buzz buzz… no vendors found nearby.",
  "🍯 Sweet nothing! Try checking another town or tag.",
  "🦦 No luck, but the otters say hi!",
  "🌲 Nothing here yet — maybe it's still growing.",
  "🍁 Crickets… or maybe just the wind in the cedars.",
  "🪶 No vendors nearby — but the ravens are talking about it.",
  "🌊 No matches found — take a deep breath of salty air and try again.",
];

// --- Tag groups for More Filters panel ---
const TAG_GROUPS: { label: string; tags: string[] }[] = [
  {
    label: "Food & Dietary",
    tags: [
      "Gluten-Free",
      "Vegan",
      "Dairy-Free",
      "Nut-Free",
      "Keto",
      "Ready to Eat",
    ],
  },
  {
    label: "Handmade & Craft",
    tags: [
      "Handmade",
      "Commercial/Reseller",
      "Metal",
      "Non-Metal (Jewelry)",
      "Beadwork",
      "Wood",
      "Leather",
      "Ceramic",
      "Glass",
      "Textile",
    ],
  },
  {
    label: "Values & Ethics",
    tags: [
      "Organic",
      "Local Ingredients",
      "Locally Designed",
      "Ethical",
      "Fair Trade",
      "Sustainable",
      "Family Farm",
      "Upcycled/Recycled",
      "Non-Profit",
    ],
  },
  {
    label: "Seasonal / Special",
    tags: [
      "Christmas/Holiday",
      "Fantasy/Faerie",
      "Crystals/Metaphysical",
      "Miniatures",
    ],
  },
];

// --- Chevron icon (inline, no extra import needed) ---
const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
      clipRule="evenodd"
    />
  </svg>
);

// --- Slim dropdown select ---
function FilterSelect<T extends string>({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: T | "all";
  onChange: (val: T | "all") => void;
  placeholder: string;
  options: readonly T[];
}) {
  const isActive = value !== "all";
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T | "all")}
        className={`appearance-none text-xs pl-3 pr-7 py-1.5 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-brand-gold cursor-pointer transition-colors ${
          isActive
            ? "bg-brand-gold text-white font-semibold"
            : "bg-white/90 text-gray-800 hover:bg-white"
        }`}
      >
        <option value="all">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${
          isActive ? "text-white" : "text-gray-500"
        }`}
      />
    </div>
  );
}

const HomePage: React.FC<HomePageProps> = ({
  markets,
  vendors,
  onSelectMarket,
  onSelectVendor,
  onViewAllMarkets,
  onViewAllVendors,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [locationTerm, setLocationTerm] = useState("");

  const [filteredMarkets, setFilteredMarkets] = useState<SearchableMarket[]>(
    []
  );
  const [filteredVendors, setFilteredVendors] = useState<SearchableVendor[]>(
    []
  );

  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationStatus, setLocationStatus] = useState("Checking location...");
  const [searchCenter, setSearchCenter] = useState<Coordinates | null>(null);

  const [selectedMarketCategory, setSelectedMarketCategory] =
    useState<MarketCategory | "all">("all");
  const [selectedVendorCategory, setSelectedVendorCategory] =
    useState<VendorCategory | "all">("all");
  const [selectedVendorTags, setSelectedVendorTags] = useState<VendorTag[]>([]);
  const [sortBy, setSortBy] = useState<"match" | "distance">("match");

  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);

  // What's New carousel
  const [carouselIdx, setCarouselIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);
  // card width (w-36 = 144px) + gap (gap-3 = 12px)
  const CARD_STEP = 156;

  const handleTagSelection = (tag: VendorTag) => {
    setSelectedVendorTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const activeMarkets = useMemo(
    () => markets.filter((m) => m.status === "active"),
    [markets]
  );
  const activeVendors = useMemo(
    () => vendors.filter((v) => v.status === "active"),
    [vendors]
  );

  const activeTagCount = selectedVendorTags.length;

  const featuredItems = useMemo(() => {
    const getAverageRating = (reviews: Review[]) => {
      if (!reviews || reviews.length === 0) return 0;
      return (
        reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      );
    };

    const featuredMarkets = activeMarkets.filter((m) => m.isFeatured);
    const featuredVendors = activeVendors.filter((v) => v.isFeatured);

    const topRatedMarkets = [...activeMarkets]
      .sort(
        (a, b) => getAverageRating(b.reviews) - getAverageRating(a.reviews)
      )
      .slice(0, 2);

    const topRatedVendors = [...activeVendors]
      .sort(
        (a, b) => getAverageRating(b.reviews) - getAverageRating(a.reviews)
      )
      .slice(0, 2);

    const combined = [
      ...featuredMarkets.map((m) => ({ type: "market", data: m as Market })),
      ...featuredVendors.map((v) => ({ type: "vendor", data: v as Vendor })),
      ...topRatedMarkets.map((m) => ({ type: "market", data: m as Market })),
      ...topRatedVendors.map((v) => ({ type: "vendor", data: v as Vendor })),
    ];

    const uniqueItems = Array.from(
      new Map(combined.map((item) => [item.data.id, item])).values()
    );

    return uniqueItems.sort(() => 0.5 - Math.random()).slice(0, 6);
  }, [activeMarkets, activeVendors]);

  const whatsNewItems = useMemo(() => {
    const allItems: ((Market | Vendor) & { type: "market" | "vendor" })[] = [
      ...activeMarkets.map((m) => ({ ...m, type: "market" as const })),
      ...activeVendors.map((v) => ({ ...v, type: "vendor" as const })),
    ];
    return allItems
      .sort(
        (a, b) =>
          new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime()
      )
      .slice(0, 20);
  }, [activeMarkets, activeVendors]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(coords);
        setSearchCenter(coords);
        setLocationStatus("Using current location");
        setLocationTerm("Current Location");
      },
      () => {
        setLocationStatus("Enter a location to find nearby results.");
      }
    );
  }, []);

  const handleLocationTermChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newLocationTerm = e.target.value;
    setLocationTerm(newLocationTerm);
    if (newLocationTerm === "" || newLocationTerm === "Current Location") {
      setSearchCenter(userLocation);
    } else {
      const foundMarket = activeMarkets.find((m) =>
        (m.location?.address || "")
          .toLowerCase()
          .includes(newLocationTerm.toLowerCase())
      );
      if (foundMarket && foundMarket.location?.coordinates) {
        setSearchCenter(foundMarket.location.coordinates);
      } else {
        setSearchCenter(null);
      }
    }
  };

  const performSearch = useCallback(() => {
    let resultsMarkets: SearchableMarket[] = activeMarkets.filter((market) => {
      const searchTextMatch =
        searchTerm === "" ||
        fuzzySearch(
          searchTerm,
          `${market.name} ${market.description} ${market.category}`
        );
      const categoryMatch =
        selectedMarketCategory === "all" ||
        market.category === selectedMarketCategory;
      return searchTextMatch && categoryMatch;
    });

    let resultsVendors: SearchableVendor[] = activeVendors.filter((vendor) => {
      const searchTextMatch =
        searchTerm === "" ||
        fuzzySearch(
          searchTerm,
          `${vendor.name} ${vendor.description} ${
            vendor.category
          } ${(vendor.tags || []).join(" ")}`
        );
      const categoryMatch =
        selectedVendorCategory === "all" ||
        vendor.category === selectedVendorCategory;
      const tagMatch =
        selectedVendorTags.length === 0 ||
        selectedVendorTags.every((tag) => vendor.tags?.includes(tag));
      return searchTextMatch && categoryMatch && tagMatch;
    });

    if (searchCenter) {
      const marketsWithCoords = resultsMarkets.filter(
        (m) => m.location && m.location.coordinates
      );

      resultsMarkets = marketsWithCoords.map((m) => ({
        ...m,
        distance: getDistance(searchCenter, m.location!.coordinates),
      }));

      const marketCoordsMap = new Map(
        marketsWithCoords.map((m) => [m.id, m.location!.coordinates])
      );

      resultsVendors = resultsVendors.map((v) => {
        const attendingMarketIds = v.attendingMarketIds || [];

        const distances = attendingMarketIds
          .map((marketId) => marketCoordsMap.get(marketId))
          .filter(
            (coords): coords is Coordinates => coords !== undefined
          )
          .map((coords) => getDistance(searchCenter, coords));

        const nearestMarketDist =
          distances.length > 0 ? Math.min(...distances) : undefined;

        return { ...v, distance: nearestMarketDist };
      });

      const sortByDistance = <T extends { distance?: number }>(arr: T[]) => {
        return arr.sort((a, b) => {
          if (a.distance == null && b.distance == null) return 0;
          if (a.distance == null) return 1;
          if (b.distance == null) return -1;
          return a.distance - b.distance;
        });
      };

      resultsMarkets = sortByDistance(resultsMarkets);
      resultsVendors = sortByDistance(resultsVendors);
    }

    setFilteredMarkets(resultsMarkets);
    setFilteredVendors(resultsVendors);
  }, [
    searchTerm,
    activeMarkets,
    activeVendors,
    selectedMarketCategory,
    selectedVendorCategory,
    selectedVendorTags,
    searchCenter,
  ]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const showSearchResults =
    searchTerm.trim().length > 0 ||
    (locationTerm.trim().length > 0 &&
        locationTerm !== "Current Location") ||
    selectedMarketCategory !== "all" ||
    selectedVendorCategory !== "all" ||
    selectedVendorTags.length > 0;

  const randomNoResults =
    noResultsMessages[Math.floor(Math.random() * noResultsMessages.length)];

  const scrollToResults = () => {
    const el = document.getElementById("results");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedMarketCategory("all");
    setSelectedVendorCategory("all");
    setSelectedVendorTags([]);
  };

  return (
    <main>
      {/* Hero section */}
      <div id="pagetop-header" className="relative bg-brand-blue text-white py-16 px-4 text-center">
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 font-serif">
            Your Guide to Island Markets
          </h1>
          <p className="max-w-2xl mx-auto mb-8 text-lg text-brand-teal-light">
            Find farmers markets, artisan goods, and fresh produce on Vancouver
            Island.
          </p>

          {/* Search inputs */}
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 bg-white/20 p-2 rounded-full">
              <div className="relative md:col-span-3">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for sourdough, pottery, etc..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") scrollToResults();
                  }}
                  className="w-full p-3 pl-12 rounded-full text-gray-900 focus:outline-none focus:ring-4 focus:ring-brand-gold border-0"
                />
              </div>
              <div className="relative md:col-span-2">
                <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="City or postal code"
                  value={locationTerm}
                  onChange={handleLocationTermChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") scrollToResults();
                  }}
                  className="w-full p-3 pl-12 rounded-full text-gray-900 focus:outline-none focus:ring-4 focus:ring-brand-gold border-0"
                />
              </div>
            </div>
            <div className="flex items-center justify-center mt-3 text-sm text-brand-teal-light">
              <span>{locationStatus}</span>
            </div>
          </div>

          {/* Slim filter bar */}
          <div className="max-w-3xl mx-auto mt-4">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <FilterSelect
                value={selectedMarketCategory}
                onChange={(val) => setSelectedMarketCategory(val as MarketCategory | "all")}
                placeholder="Market Type"
                options={Object.values(MarketCategories) as MarketCategory[]}
              />

              <FilterSelect
                value={selectedVendorCategory}
                onChange={(val) => setSelectedVendorCategory(val as VendorCategory | "all")}
                placeholder="Vendor Product"
                options={Object.values(VendorCategoriesByType).flat()}
              />

              {/* Sort select */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as "match" | "distance")
                  }
                  className="appearance-none text-xs pl-3 pr-7 py-1.5 rounded-full border-0 bg-white/90 text-gray-800 hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold cursor-pointer transition-colors"
                >
                  <option value="match">Best Match</option>
                  <option value="distance" disabled={!searchCenter}>
                    Distance{!searchCenter ? " (needs location)" : ""}
                  </option>
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              </div>

              {/* More Filters button */}
              <button
                type="button"
                onClick={() => setMoreFiltersOpen((open) => !open)}
                className={`flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-full font-medium transition-colors ${
                  moreFiltersOpen || activeTagCount > 0
                    ? "bg-brand-gold text-white"
                    : "bg-white/90 text-gray-800 hover:bg-white"
                }`}
              >
                <FilterIcon className="w-4 h-4" />
                More Filters
                {activeTagCount > 0 && (
                  <span className="bg-white text-brand-blue text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold leading-none">
                    {activeTagCount}
                  </span>
                )}
              </button>

              {/* Clear all — only shown when filters are active */}
              {showSearchResults && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full text-white/70 hover:text-white transition-colors"
                >
                  <XIcon className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* More Filters expanded panel */}
      {moreFiltersOpen && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {TAG_GROUPS.map((group) => (
                <div key={group.label}>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
                    {group.label}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {group.tags.map((tag) => {
                      const isActive = selectedVendorTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleTagSelection(tag)}
                          className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                            isActive
                              ? "bg-brand-blue text-white font-semibold"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {activeTagCount > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  {activeTagCount} tag{activeTagCount !== 1 ? "s" : ""} selected
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedVendorTags([])}
                  className="text-sm text-brand-blue hover:underline"
                >
                  Clear tags
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {showSearchResults ? (
          <>
            <div id="results" />
            <h2 className="text-3xl font-bold font-sans font-semibold text-brand-blue mb-6">
              Results
            </h2>
            {filteredMarkets.length === 0 && filteredVendors.length === 0 ? (
              <div className="text-center text-gray-600 py-8">
                <p className="text-lg font-medium mb-2">{randomNoResults}</p>
                <p className="text-sm mb-4">
                  Try different keywords or check out a nearby market instead.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="bg-brand-blue text-white px-4 py-2 rounded-full font-semibold hover:bg-brand-gold transition"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                {filteredMarkets.length > 0 && (
                  <section className="mb-12">
                    <h3 className="text-2xl font-sans font-semibold text-brand-blue mb-4">
                      Markets
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {filteredMarkets.map((market) => (
                        <MarketCard
                          key={market.id}
                          market={market}
                          onSelect={onSelectMarket}
                          distance={market.distance}
                        />
                      ))}
                    </div>
                  </section>
                )}
                {filteredVendors.length > 0 && (
                  <section>
                    <h3 className="text-2xl font-sans font-semibold text-brand-blue mb-4">
                      Vendors
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                      {filteredVendors.map((vendor) => (
                        <VendorCard
                          key={vendor.id}
                          vendor={vendor}
                          onSelect={onSelectVendor}
                          distance={vendor.distance}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <section className="mb-10">
              <h2 className="text-3xl font-bold font-sans font-semibold text-brand-blue mb-4">
                What's New
              </h2>
              {/* Carousel */}
              <div className="relative">
                {/* Left arrow */}
                <button
                  type="button"
                  onClick={() => setCarouselIdx((i) => (i === 0 ? whatsNewItems.length - 1 : i - 1))}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-brand-gold text-white shadow hover:bg-brand-gold/80 transition-colors"
                  aria-label="Previous"
                >
                  ‹
                </button>

                {/* Track */}
                <div className="overflow-hidden mx-9">
                  <div
                    className="flex gap-3 transition-transform duration-300 ease-in-out"
                    style={{ transform: `translateX(-${carouselIdx * CARD_STEP}px)` }}
                    onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
                    onTouchEnd={(e) => {
                      if (touchStartX.current === null) return;
                      const delta = touchStartX.current - e.changedTouches[0].clientX;
                      if (delta > 40) setCarouselIdx((i) => (i === whatsNewItems.length - 1 ? 0 : i + 1));
                      else if (delta < -40) setCarouselIdx((i) => (i === 0 ? whatsNewItems.length - 1 : i - 1));
                      touchStartX.current = null;
                    }}
                  >
                    {whatsNewItems.map((item) => {
                      const imageSrc = item.logoUrl || item.photos?.[0];
                      const joinLabel = (() => {
                        if (!item.joinDate) return null;
                        const parts = item.joinDate.split('-').map(Number);
                        if (parts.length !== 3 || parts.some(isNaN)) return null;
                        return new Date(parts[0], parts[1] - 1, parts[2])
                          .toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
                      })();
                      return (
                        <div
                          key={item.id}
                          className="flex-shrink-0 w-36 bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => item.type === "market" ? onSelectMarket(item.id) : onSelectVendor(item.id)}
                        >
                          {imageSrc
                            ? <img src={imageSrc} alt={item.name} className="w-full h-24 object-cover" />
                            : <div className="w-full h-24 bg-brand-cream flex items-center justify-center">
                                <span className="text-brand-blue/40 text-3xl font-serif">{item.name[0]}</span>
                              </div>
                          }
                          <div className="p-2">
                            <span className={`text-xs font-semibold uppercase tracking-wide ${item.type === "market" ? "text-brand-gold" : "text-brand-light-blue"}`}>
                              {item.type === "market" ? "Market" : "Vendor"}
                            </span>
                            <p className="text-sm font-bold text-brand-blue truncate leading-tight">{item.name}</p>
                            {joinLabel && <p className="text-xs text-gray-400 mt-0.5">{joinLabel}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right arrow */}
                <button
                  type="button"
                  onClick={() => setCarouselIdx((i) => (i === whatsNewItems.length - 1 ? 0 : i + 1))}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-brand-gold text-white shadow hover:bg-brand-gold/80 transition-colors"
                  aria-label="Next"
                >
                  ›
                </button>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold font-sans font-semibold text-brand-blue mb-6">
                Featured Markets & Vendors
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                {featuredItems.map((item) =>
                  item.type === "market" ? (
                    <MarketCard
                      key={item.data.id}
                      market={item.data as Market}
                      onSelect={onSelectMarket}
                    />
                  ) : (
                    <VendorCard
                      key={item.data.id}
                      vendor={item.data as Vendor}
                      onSelect={onSelectVendor}
                    />
                  )
                )}
              </div>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => onViewAllMarkets()}
                  className="px-6 py-2.5 rounded-full border-2 border-brand-blue text-brand-blue font-semibold hover:bg-brand-blue hover:text-white transition-colors"
                >
                  View all markets →
                </button>
                <button
                  onClick={() => onViewAllVendors()}
                  className="px-6 py-2.5 rounded-full border-2 border-brand-blue text-brand-blue font-semibold hover:bg-brand-blue hover:text-white transition-colors"
                >
                  View all vendors →
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
};

export default HomePage;
