import { motion, useMotionValue, useTransform } from "framer-motion";
import { Ban, Star, MapPin, Clock, ExternalLink } from "lucide-react";

const PRICE_MAP = { 1: "$", 2: "$$", 3: "$$$", 4: "$$$$" };

const FOOD_IMAGES = {
  mexican: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80",
  italian: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
  pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80",
  sushi: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80",
  japanese: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800&q=80",
  chinese: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80",
  burgers: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
  bbq: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&q=80",
  sandwiches: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80",
  thai: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&q=80",
  indian: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80",
  seafood: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&q=80",
  breakfast: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80",
  american: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&q=80",
  default: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
};

function getImage(restaurant) {
  const cuisine = (restaurant?.cuisine || "").toLowerCase();
  for (const key of Object.keys(FOOD_IMAGES)) {
    if (cuisine.includes(key)) return FOOD_IMAGES[key];
  }
  return FOOD_IMAGES.default;
}

export default function RestaurantCard({ restaurant, onSwipe, onBlock, isTop }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const cardOpacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  function handleDragEnd(_, info) {
    if (info.offset.x > 100) onSwipe("maybe");
    else if (info.offset.x < -100) onSwipe("nope");
  }

  if (!restaurant) return null;

  const imgSrc = getImage(restaurant);
  const name = restaurant.name || "Unknown Restaurant";
  const cuisine = restaurant.cuisine || "";
  const rating = restaurant.rating;
  const reviewCount = restaurant.review_count;
  const priceLevel = PRICE_MAP[restaurant.price_level] || "";
  const location = restaurant.distance || restaurant.address || "";
  const serviceType = restaurant.service_type || "";
  const description = restaurant.description || "";
  const isOpen = restaurant.open_now;

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
        <div className="relative w-full" style={{ height: '260px' }}>
          <img src={imgSrc} alt={name} className="w-full h-full object-cover" crossOrigin="anonymous" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)' }} />

          {/* Open/closed badge */}
          {isOpen !== undefined && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white"
              style={{ background: isOpen ? '#16a34a' : '#dc2626' }}>
              {isOpen ? '🟢 Open Now' : '🔴 Closed'}
            </div>
          )}

          {/* Never show again */}
          {onBlock && (
            <button
              onClick={e => { e.stopPropagation(); onBlock(); }}
              className="absolute bottom-3 right-3 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-all"
              title="Never show this place again"
            >
              <Ban className="w-4 h-4 text-white" />
            </button>
          )}
        </div>

        {/* Info */}
        <div className="p-5" style={{ background: '#ffffff' }}>
          <div className="flex items-start justify-between mb-1">
            <h2 className="font-black leading-tight" style={{ fontSize: '22px', color: '#111827', margin: 0 }}>{name}</h2>
            {priceLevel && <span className="font-bold ml-2 shrink-0" style={{ color: '#6b7280', fontSize: '14px' }}>{priceLevel}</span>}
          </div>
          {cuisine && <p className="font-semibold mb-2" style={{ color: '#f97316', fontSize: '14px', margin: '4px 0 8px' }}>{cuisine}</p>}
          {description && (
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 10px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {description}
            </p>
          )}
          <div className="flex items-center gap-4" style={{ color: '#6b7280', fontSize: '13px' }}>
            {rating && (
              <span className="flex items-center gap-1">
                <Star style={{ width: 14, height: 14, color: '#f59e0b', fill: '#f59e0b' }} />
                <span style={{ fontWeight: 700, color: '#111827' }}>{rating}</span>
                {reviewCount && <span>({reviewCount})</span>}
              </span>
            )}
            {restaurant.address && (
              <span className="flex items-center gap-1">
                <MapPin style={{ width: 14, height: 14 }} />
                {restaurant.address}
              </span>
            )}
            {serviceType && (
              <span className="flex items-center gap-1">
                <Clock style={{ width: 14, height: 14 }} />
                {serviceType}
              </span>
            )}
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + location)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1.5 mt-3 font-semibold"
            style={{ color: '#4285F4', fontSize: '13px', textDecoration: 'none' }}
          >
            <ExternalLink style={{ width: 13, height: 13 }} />
            View on Google Maps
          </a>
        </div>
      </div>
    </motion.div>
  );
}