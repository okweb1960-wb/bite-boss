import { useState } from "react";
import { Star, MapPin } from "lucide-react";

const PRICE_MAP = { 1: "$", 2: "$$", 3: "$$$", 4: "$$$$" };

const FOOD_IMAGES = {
  american: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
  burgers: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
  mexican: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800",
  italian: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
  pizza: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800",
  chinese: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800",
  japanese: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800",
  sushi: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800",
  thai: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800",
  indian: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800",
  mediterranean: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",
  bbq: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800",
  seafood: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800",
  breakfast: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800",
  desserts: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800",
  cafe: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800",
  restaurant: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
};

function getImage(restaurant) {
  if (restaurant?.photo_url) return restaurant.photo_url;
  const cuisine = (restaurant?.cuisine || "").toLowerCase();
  for (const key of Object.keys(FOOD_IMAGES)) {
    if (cuisine.includes(key)) return FOOD_IMAGES[key];
  }
  return FOOD_IMAGES.restaurant;
}

export default function RestaurantListCard({ restaurant, onClick }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const {
    name = "Unknown",
    cuisine,
    address,
    rating,
    review_count,
    price_level,
    open_now,
    description,
    distance,
    delivery,
    takeout,
  } = restaurant || {};

  const priceLevel = price_level ? PRICE_MAP[price_level] : null;
  const hasDineIn = restaurant?.dineIn || restaurant?.dine_in;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
    >
      {/* Photo */}
      <div className="relative w-full overflow-hidden" style={{ height: "140px" }}>
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
        )}
        <img
          src={getImage(restaurant)}
          alt={name}
          className="w-full h-full object-cover"
          style={{ opacity: imageLoaded ? 1 : 0, transition: "opacity 0.3s" }}
          onLoad={() => setImageLoaded(true)}
        />
        {open_now === true && (
          <div
            className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-white text-xs font-semibold"
            style={{ background: "#10B981" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
            Open Now
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-black text-foreground text-base flex-1 leading-tight">{name}</h3>
          {priceLevel && (
            <span className="text-xs font-bold text-teal-600 ml-2 shrink-0">{priceLevel}</span>
          )}
        </div>

        {cuisine && (
          <p className="text-orange-500 font-semibold text-sm mb-2">{cuisine}</p>
        )}

        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-2">
          {rating && (
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3" style={{ fill: "#f59e0b", color: "#f59e0b" }} />
              <span className="font-bold text-gray-700">{rating}</span>
              {review_count && <span>({review_count})</span>}
            </span>
          )}
          {distance && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {distance}
            </span>
          )}
        </div>

        {description && (
          <p className="text-xs text-gray-500 italic mb-2 line-clamp-2">{description}</p>
        )}

        {(takeout || delivery || hasDineIn) && (
          <div className="flex gap-1.5 flex-wrap">
            {takeout && (
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">🥡 Takeout</span>
            )}
            {delivery && (
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">🚗 Delivery</span>
            )}
            {hasDineIn && (
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">🍽️ Dine-in</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}