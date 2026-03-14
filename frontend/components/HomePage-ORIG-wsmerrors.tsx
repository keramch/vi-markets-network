import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Market, Vendor, Coordinates, MarketCategory, VendorCategory, Review, VendorTag } from '../types';
import { MarketCategories, VendorCategories, VendorTags } from '../types';
import MarketCard from './MarketCard';
import VendorCard from './VendorCard';
import { SearchIcon, MapPinIcon, FilterIcon } from './Icons';
import { getDistance } from '../utils';

interface HomePageProps {
  markets: Market[];
  vendors: Vendor[];
  onSelectMarket: (id: string) => void;
  onSelectVendor: (id: string) => void;
}

interface SearchableMarket extends Market {
    distance?: number;
}
interface SearchableVendor extends Vendor {
    distance?: number;
}

const fuzzySearch = (term: string, text: string) => {
  const searchWords = term.toLowerCase().split(' ').filter(w => w);
  const targetText = text.toLowerCase();
  return searchWords.every(word => targetText.includes(word));
};

function FilterButtons<T extends string>({
  categories,
  selected,
  onSelect,
}: {
  categories: readonly T[];
  selected: T[];
  onSelect: (category: T | "all") => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => onSelect("all")}
        className={`px-2.5 py-0.5 text-xs md:text-sm rounded-full transition-colors ${
          selected.length === 0
            ? "bg-brand-blue text-white font-semibold"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={`px-2.5 py-0.5 text-xs md:text-sm rounded-full transition-colors ${
            selected.includes(category)
              ? "bg-brand-blue text-white font-semibold"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}


const HomePage: React.FC<HomePageProps> = ({ markets, vendors, onSelectMarket, onSelectVendor }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationTerm, setLocationTerm] = useState('');
  
  const [filteredMarkets, setFilteredMarkets] = useState<SearchableMarket[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<SearchableVendor[]>([]);
  
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationStatus, setLocationStatus] = useState('Checking location...');
  const [searchCenter, setSearchCenter] = useState<Coordinates | null>(null);

  const [selectedMarketCategory, setSelectedMarketCategory] = useState<MarketCategory | 'all'>('all');
  const [selectedVendorCategory, setSelectedVendorCategory] = useState<VendorCategory | 'all'>('all');
  const [selectedVendorTags, setSelectedVendorTags] = useState<VendorTag[]>([]);
  const [sortBy, setSortBy] = useState<'match' | 'distance'>('match');

  const [filtersOpen, setFiltersOpen] = useState(true);
  const activeFilterCount =
        (selectedMarketCategory === 'all' ? 0 : 1) +
        (selectedVendorCategory === 'all' ? 0 : 1) +
        selectedVendorTags.length;

  const handleTagSelection = (tag: VendorTag | 'all') => {
    if (tag === 'all') {
        setSelectedVendorTags([]);
        return;
    }
    setSelectedVendorTags(prev => {
        if (prev.includes(tag)) {
            return prev.filter(t => t !== tag);
        } else {
            return [...prev, tag];
        }
    });
  }
  
  const activeMarkets = useMemo(() => markets.filter(m => m.status === 'active'), [markets]);
  const activeVendors = useMemo(() => vendors.filter(v => v.status === 'active'), [vendors]);


  const featuredItems = useMemo(() => {
    const getAverageRating = (reviews: Review[]) => {
      if (!reviews || reviews.length === 0) return 0;
      return reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    };

    const featuredMarkets = activeMarkets.filter(m => m.isFeatured);
    const featuredVendors = activeVendors.filter(v => v.isFeatured);
    
    const topRatedMarkets = [...activeMarkets]
        .sort((a, b) => getAverageRating(b.reviews) - getAverageRating(a.reviews))
        .slice(0, 2);

    const topRatedVendors = [...activeVendors]
        .sort((a, b) => getAverageRating(b.reviews) - getAverageRating(a.reviews))
        .slice(0, 2);

    const combined = [
        ...featuredMarkets.map(m => ({ type: 'market', data: m })),
        ...featuredVendors.map(v => ({ type: 'vendor', data: v })),
        ...topRatedMarkets.map(m => ({ type: 'market', data: m })),
        ...topRatedVendors.map(v => ({ type: 'vendor', data: v })),
    ];
    
    const uniqueItems = Array.from(new Map(combined.map(item => [item.data.id, item])).values());
    
    return uniqueItems.sort(() => 0.5 - Math.random()).slice(0, 6);
  }, [activeMarkets, activeVendors]);

  const whatsNewItems = useMemo(() => {
    const allItems: ((Market | Vendor) & { type: 'market' | 'vendor' })[] = [
      ...activeMarkets.map(m => ({ ...m, type: 'market' as const })),
      ...activeVendors.map(v => ({ ...v, type: 'vendor' as const }))
    ];
    return allItems.sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime()).slice(0, 5);
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
        setLocationStatus('Using current location');
        setLocationTerm('Current Location');
      },
      () => {
        setLocationStatus('Enter a location to find nearby results.');
      }
    );
  }, []);
  
  const handleLocationTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLocationTerm = e.target.value;
    setLocationTerm(newLocationTerm);
    if (newLocationTerm === '' || newLocationTerm === 'Current Location') {
        setSearchCenter(userLocation);
    } else {
        const foundMarket = activeMarkets.find(m => m.location.address.toLowerCase().includes(newLocationTerm.toLowerCase()));
        if (foundMarket) {
            setSearchCenter(foundMarket.location.coordinates);
        } else {
            setSearchCenter(null);
        }
    }
  };

  const performSearch = useCallback(() => {
    let resultsMarkets: SearchableMarket[] = activeMarkets.filter(market => {
      const searchTextMatch = searchTerm === '' || fuzzySearch(searchTerm, `${market.name} ${market.description} ${market.category}`);
      const categoryMatch = selectedMarketCategory === 'all' || market.category === selectedMarketCategory;
      return searchTextMatch && categoryMatch;
    });
    
    let resultsVendors: SearchableVendor[] = activeVendors.filter(vendor => {
      const searchTextMatch = searchTerm === '' || fuzzySearch(searchTerm, `${vendor.name} ${vendor.description} ${vendor.category} ${(vendor.tags || []).join(' ')}`);
      const categoryMatch = selectedVendorCategory === 'all' || vendor.category === selectedVendorCategory;
      const tagMatch = selectedVendorTags.length === 0 || selectedVendorTags.every(tag => vendor.tags?.includes(tag));
      return searchTextMatch && categoryMatch && tagMatch;
    });
    
    if (searchCenter) {
  // Filter only markets that have coordinates
  const marketsWithCoords = resultsMarkets.filter(
    m => m.location && m.location.coordinates
  );

  resultsMarkets = marketsWithCoords.map(m => ({
    ...m,
    distance: getDistance(searchCenter, m.location!.coordinates)
  }));

  const marketCoordsMap = new Map(
    marketsWithCoords.map(m => [m.id, m.location!.coordinates])
  );

  resultsVendors = resultsVendors.map(v => {
    const attendingMarketIds = v.attendingMarketIds || [];

    const distances = attendingMarketIds
      .map(marketId => marketCoordsMap.get(marketId))
      .filter((coords): coords is Coordinates => coords !== undefined)
      .map(coords => getDistance(searchCenter, coords));

    const nearestMarketDist =
      distances.length > 0 ? Math.min(...distances) : undefined;

    return { ...v, distance: nearestMarketDist };
  });

  // ✅ New helper for consistent sorting
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

  }, [searchTerm, locationTerm, activeMarkets, activeVendors, selectedMarketCategory, selectedVendorCategory, selectedVendorTags, searchCenter, sortBy]);

  useEffect(() => {
      performSearch();
  }, [performSearch]);
  
  
  const showSearchResults = searchTerm || locationTerm || selectedMarketCategory !== 'all' || selectedVendorCategory !== 'all' || selectedVendorTags.length > 0;
  
const noResultsMessages = [
  "🥕 No matches found — maybe try 'bread' instead of 'sourdough'?",
  "🌾 Nothing sprouting here yet! Try widening your search.",
  "🧺 Empty basket! Maybe your next favorite is setting up soon.",
  "🐝 Buzz buzz… no vendors found nearby.",
  "🍯 Sweet nothing! Try checking another town or tag.",
  "🦦 No luck, but the otters say hi!",
  "🌲 Nothing here yet — maybe it’s still growing.",
  "🍁 Crickets… or maybe just the wind in the cedars.",
  "🪶 No vendors nearby — but the ravens are talking about it.",
  "🌊 No matches found — take a deep breath of salty air and try again."
];
const randomNoResults = noResultsMessages[Math.floor(Math.random() * noResultsMessages.length)];

const scrollToResults = () => {
  const el = document.getElementById("results");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

  return (
    <main>
      <div className="relative bg-brand-blue text-white py-20 px-4 text-center">
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 font-serif">Your Guide to Island Markets</h1>
          <p className="max-w-2xl mx-auto mb-8 text-lg text-brand-light-blue">Find farmers markets, artisan goods, and fresh produce on Vancouver Island.</p>
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
                      if (e.key === "Enter") {
                        scrollToResults();
                      }
                    }}
                    className="w-full p-3 pl-12 rounded-full text-gray-900 focus:outline-none focus:ring-4 focus:ring-brand-gold border-0"
                  />
              </div>
              <div className="relative md:col-span-2">
                 <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                 <input 
                    type="text"
                    placeholder="City or postal code"
                    value={locationTerm}
                    onChange={handleLocationTermChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        scrollToResults();
                      }
                    }}
                    className="w-full p-3 pl-12 rounded-full text-gray-900 focus:outline-none focus:ring-4 focus:ring-brand-gold border-0"
                  />
              </div>
            </div>
             <div className="flex items-center justify-center mt-4 text-sm">
                <span>{locationStatus}</span>
            </div>
          </div>
        </div>
      </div>

<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">

  {/* Filters header / toggle */}
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-lg font-semibold text-brand-blue flex items-center gap-2">
      Filters
      {activeFilterCount > 0 && (
        <span className="text-xs bg-brand-blue/10 text-brand-blue px-2 py-1 rounded-full">
          {activeFilterCount} active
        </span>
      )}
    </h2>
    <button
      type="button"
      onClick={() => setFiltersOpen(open => !open)}
      className="text-sm px-3 py-1 rounded-full border border-gray-300 hover:bg-gray-100 transition"
    >
      {filtersOpen ? 'Hide' : 'Show'}
    </button>
  </div>

  {/* Collapsible filters panel */}
  {filtersOpen && (
    <div className="bg-white p-6 rounded-lg shadow-md mb-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
        {/* 🔹 your existing filter content stays exactly as-is inside here */}
        <div className="md:col-span-1">
          <h3 className="font-semibold text-gray-700 mb-2 flex items-center"><FilterIcon className="w-5 h-5 mr-2 text-brand-blue" />Market Type</h3>
          <FilterButtons
            categories={Object.values(MarketCategories)}
            selected={selectedMarketCategory === 'all' ? [] : [selectedMarketCategory]}
            onSelect={setSelectedMarketCategory}
          />
        </div>
        <div className="md:col-span-2">
          <h3 className="font-semibold text-gray-700 mb-2">Vendor Product</h3>
          <FilterButtons
            categories={Object.values(VendorCategories)}
            selected={selectedVendorCategory === 'all' ? [] : [selectedVendorCategory]}
            onSelect={setSelectedVendorCategory}
          />
        </div>
        <div className="md:col-span-3">
          <h3 className="font-semibold text-gray-700 mb-2">Refine by Tag</h3>
          <FilterButtons
            categories={Object.values(VendorTags)}
            selected={selectedVendorTags}
            onSelect={handleTagSelection}
          />
        </div>
        {showSearchResults && (
          <div className="md:col-span-3 border-t pt-4 mt-2">
            <h3 className="font-semibold text-gray-700 mb-2">Sort by</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setSortBy('match')} className={`px-3 py-1 text-sm rounded-full transition-colors ${sortBy === 'match' ? 'bg-brand-blue text-white font-semibold' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                Best Match
              </button>
              <button
                onClick={() => setSortBy('distance')}
                disabled={!searchCenter}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${sortBy === 'distance' ? 'bg-brand-blue text-white font-semibold' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} disabled:bg-gray-100 disabled:cursor-not-allowed`}
              >
                Distance
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )}

  {showSearchResults ? (
    ...

            <>
                <div id="results" />
                <h2 className="text-3xl font-bold font-serif text-brand-blue mb-6">Results</h2>
                {filteredMarkets.length === 0 && filteredVendors.length === 0 ? (
                    <div className="text-center text-gray-600 py-8">
                    <p className="text-lg font-medium mb-2">{randomNoResults}</p>
                    <p className="text-sm mb-4">
                      Try different keywords or check out a nearby market instead.
                    </p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedMarketCategory('all');
                        setSelectedVendorCategory('all');
                        setSelectedVendorTags([]);
                      }}
                      className="bg-brand-blue text-white px-4 py-2 rounded-full font-semibold hover:bg-brand-gold transition"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                    <>
                    {filteredMarkets.length > 0 && <section className="mb-12">
                        <h3 className="text-2xl font-semibold font-serif text-brand-blue mb-4">Markets</h3>
                         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredMarkets.map(market => <MarketCard key={market.id} market={market} onSelect={onSelectMarket} distance={market.distance} />)}
                        </div>
                    </section>}
                     {filteredVendors.length > 0 && <section>
                        <h3 className="text-2xl font-semibold font-serif text-brand-blue mb-4">Vendors</h3>
                         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            {filteredVendors.map(vendor => <VendorCard key={vendor.id} vendor={vendor} onSelect={onSelectVendor} distance={vendor.distance}/>)}
                        </div>
                    </section>}
                    </>
                )}
            </>
        ) : (
             <>
                <section className="mb-12">
                  <h2 className="text-3xl font-bold font-serif text-brand-blue mb-6">What's New</h2>
                   <div className="space-y-4">
                        {whatsNewItems.map(item => {
                          const imageSrc = item.logoUrl || item.photos?.[0]; //
                          return (
                            <div key={item.id} className="bg-white p-4 rounded-lg shadow-md flex items-center gap-4">
                                {imageSrc && (
                                  <img src={imageSrc} alt={item.name} className="w-16 h-16 rounded-md object-cover flex-shrink-0" />
                                 )}
                                  <div className="flex-grow">
                                    <span className="text-xs text-brand-light-blue font-semibold uppercase">{item.type}</span>
                                    <h3 className="font-bold text-brand-blue">{item.name}</h3>
                                    <p className="text-sm text-gray-500">Joined on {new Date(item.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                                                          
                                <button
                                    onClick={() => item.type === 'market' ? onSelectMarket(item.id) : onSelectVendor(item.id)}
                                    className="bg-brand-blue/10 text-brand-blue font-semibold px-4 py-2 rounded-full hover:bg-brand-blue/20 transition-colors"
                                >
                                    View Profile
                                </button>
                            </div>
                        );
})}
                   </div>
                </section>
                <section className="mb-12">
                    <h2 className="text-3xl font-bold font-serif text-brand-blue mb-6">Featured Markets & Vendors</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {featuredItems.map(item => (
                           item.type === 'market' 
                           ? <MarketCard key={item.data.id} market={item.data as Market} onSelect={onSelectMarket} featured />
                           : <VendorCard key={item.data.id} vendor={item.data as Vendor} onSelect={onSelectVendor} featured />
                        ))}
                    </div>
                </section>
             </>
        )}
      </div>
    </main>
  );
};

export default HomePage;