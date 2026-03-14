import React from "react";
import { AwardIcon, TagIcon, StarIcon, MapPinIcon } from "./Icons";
import type { Vendor } from "../types";

interface VendorCardProps {
  vendor: Vendor;
  onSelect: (id: string) => void;
  compact?: boolean;
  featured?: boolean;
  distance?: number;
}

const VendorCard: React.FC<VendorCardProps> = ({
  vendor,
  onSelect,
  compact = false,
  featured = false,
  distance,
}) => {
  const imageSrc = vendor.logoUrl || vendor.photos?.[0] || "/placeholder.jpg";

  const avgRating =
    vendor.reviews?.length > 0
      ? vendor.reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / vendor.reviews.length
      : null;

  const city = vendor.city;

  return (
    <div
      className={`bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 cursor-pointer relative ${
        compact ? "flex" : ""
      }`}
      onClick={() => onSelect(vendor.id)}
    >
      {featured && (
        <div className="absolute top-2 right-2 bg-brand-gold text-white text-xs font-bold px-2 py-1 rounded-full flex items-center z-10">
          <AwardIcon className="w-4 h-4 mr-1" />
          Featured
        </div>
      )}

      <img
        className={compact ? "w-24 h-24 object-cover flex-shrink-0" : "w-full h-36 object-cover"}
        src={imageSrc}
        alt={vendor.name}
      />

      <div className={`p-3 ${compact ? "flex-1" : ""}`}>
        <h3 className="text-base font-bold text-brand-blue font-serif mb-1 leading-tight">
          {vendor.name}
        </h3>

        {vendor.description && !compact && (
          <p className="text-xs text-gray-500 mb-1.5 line-clamp-1">{vendor.description}</p>
        )}

        <div className="flex items-center text-gray-500 mb-1">
          <TagIcon className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
          <span className="text-xs">{vendor.category}</span>
        </div>

        {(city || distance !== undefined) && (
          <div className="flex items-center text-gray-500 mb-1">
            <MapPinIcon className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
            {city && <span className="text-xs truncate">{city}</span>}
            {distance !== undefined && (
              <span className={`text-xs font-semibold text-brand-blue flex-shrink-0 ${city ? 'ml-1' : ''}`}>
                {city ? '· ' : ''}{distance.toFixed(1)} km
              </span>
            )}
          </div>
        )}

        {avgRating !== null && (
          <div className="flex items-center">
            <StarIcon className="w-3.5 h-3.5 mr-1 text-brand-gold" filled />
            <span className="text-xs font-semibold text-brand-text">{avgRating.toFixed(1)}</span>
            <span className="text-xs text-gray-400 ml-1">({vendor.reviews.length})</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorCard;
