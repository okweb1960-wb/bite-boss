import { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Ban, Star, MapPin, Clock, ExternalLink } from "lucide-react";

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
  vegetarian: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",
  vegan: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",
  sandwiches: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800",
  chicken: "https://images.unsplash.com/photo-1562967914-608f82629710?w=800",
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

function getPriceDisplay(price_level) {
  if (!price_level) return null;
  const map = { 1: "$", 2: "$$", 3: "$$$", 4: "$$$$" };
  return map[price_level] || map[price_level.toString()];
}

export default function RestaurantCard({ restaurant, onSwipe, onBlock, isTop }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { name = 'Unknown', cuisine, address, rating, review_count, price_level, open_now, description, photo_url, distance, delivery, takeout, dineIn } = restaurant || {};
  const priceLevel = price_level ? PRICE_MAP[price_level] || PRICE_MAP[price_level.toString()] : null;
  const isOpen = open_now;
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const cardOpacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  function handleDragEnd(_, info) {
    if (info.offset.x > 100) onSwipe("maybe");
    else if (info.offset.x < -100) onSwipe("nope");
  }

  if (!restaurant) return null;

  const imgSrc = getImage(restaurant);
  const hasRealPhoto = !!restaurant.photo_url;

  return (
    <motion.div
      style={{ x, rotate, opacity: cardOpacity }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.03 }}
      className="absolute inset-0 z-20 cursor-grab active:cursor-grabbing"
    >
      <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl" style={{ background: '#ffffff' }}>

        {/* Photo */}
        <div className="relative w-full" style={{ height: '220px', overflow: 'hidden' }}>
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 animate-pulse" />
          )}
          <img
            src={imgSrc}
            alt={name}
            className="w-full h-full object-cover transition-opacity duration-300"
            style={{ opacity: imageLoaded ? 1 : 0 }}
            onLoad={() => setImageLoaded(true)}
            crossOrigin="anonymous"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)' }} />

          {/* Open Now badge — overlapping bottom-left */}
          {isOpen === true && (
            <div className="absolute" style={{ bottom: '-14px', left: '16px', zIndex: 10 }}>
              <div className="px-3 py-1.5 rounded-full text-xs font-bold text-white bg-green-500 border-2 border-white" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                🟢 Open Now
              </div>
            </div>
          )}

          {/* No photo yet badge */}
          {!hasRealPhoto && imageLoaded && (
            <div className="absolute bottom-3 left-3 px-2 py-1 rounded-full text-xs font-semibold text-white"
              style={{ background: 'rgba(0, 0, 0, 0.6)' }}>
              📷 No photo yet
            </div>
          )}
        </div>
        <div className="px-5 py-5" style={{ background: '#ffffff' }}>
          {/* Row 1: Name + Price */}
          <div className="flex items-start justify-between mb-1">
            <h2 className="font-black leading-tight" style={{ fontSize: '22px', color: '#111827', margin: 0, flex: 1 }}>{name}</h2>
            {restaurant.price_level && <span className="font-bold ml-2 shrink-0" style={{ color: '#059669', fontSize: '14px' }}>{getPriceDisplay(restaurant.price_level)}</span>}
          </div>

          {/* Row 2: Cuisine + Distance */}
          <div className="mb-2 flex items-center gap-2">
            {cuisine && <p className="font-semibold" style={{ color: '#f97316', fontSize: '14px', margin: 0 }}>{cuisine}</p>}
            {cuisine && restaurant.distance && <span style={{ color: '#6b7280', fontSize: '14px' }}>•</span>}
            {restaurant.distance && <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>📍 {restaurant.distance}</p>}
          </div>

          {/* Row 3: Rating */}
          {rating && (
            <div className="mb-2 flex items-center gap-1" style={{ color: '#111827', fontSize: '13px' }}>
              <Star style={{ width: 14, height: 14, color: '#f59e0b', fill: '#f59e0b' }} />
              <span style={{ fontWeight: 700 }}>{rating}</span>
              {review_count && <span style={{ color: '#6b7280' }}>({review_count})</span>}
            </div>
          )}

          {/* Row 4: Description */}
          {description && (
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '6px 0 8px', lineHeight: 1.4, fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {description}
            </p>
          )}

          {/* Row 5: Service Tags */}
          {(restaurant.takeout || restaurant.delivery || restaurant.dineIn) && (
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {restaurant.takeout && <span style={{ background: '#F3F4F6', color: '#6B7280', fontSize: '11px', padding: '4px 8px', borderRadius: '12px', fontWeight: 500 }}>🥡 Takeout</span>}
              {restaurant.delivery && <span style={{ background: '#F3F4F6', color: '#6B7280', fontSize: '11px', padding: '4px 8px', borderRadius: '12px', fontWeight: 500 }}>🚗 Delivery</span>}
              {restaurant.dineIn && <span style={{ background: '#F3F4F6', color: '#6B7280', fontSize: '11px', padding: '4px 8px', borderRadius: '12px', fontWeight: 500 }}>🍽️ Dine-in</span>}
            </div>
          )}

          {/* Row 6: CTA + Block */}
          <div className="flex items-center justify-between">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + address)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1.5 font-semibold"
              style={{ color: '#4285F4', fontSize: '13px', textDecoration: 'none' }}
            >
              <ExternalLink style={{ width: 13, height: 13 }} />
              View on Google Maps
            </a>
            {onBlock && (
              <button
                onClick={e => { e.stopPropagation(); onBlock(); }}
                className="p-1.5 rounded-full hover:bg-red-50 transition-all"
                title="Never show this place again"
              >
                <Ban className="w-5 h-5 text-red-600" style={{ strokeWidth: 2.5 }} />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}