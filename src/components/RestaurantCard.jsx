import { motion, useMotionValue, useTransform } from "framer-motion";
import { Star, MapPin, Clock } from "lucide-react";

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
  if (restaurant.photo_url) return restaurant.photo_url;
  const cuisine = (restaurant.cuisine || "").toLowerCase();
  for (const key of Object.keys(FOOD_IMAGES)) {
    if (cuisine.includes(key)) return FOOD_IMAGES[key];
  }
  return FOOD_IMAGES.default;
}

export default function RestaurantCard({ restaurant, onSwipe, isTop }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const nopeOpacity = useTransform(x, [-100, -20, 0], [1, 0, 0]);
  const maybeOpacity = useTransform(x, [0, 20, 100], [0, 0, 1]);

  function handleDragEnd(_, info) {
    if (info.offset.x > 100) onSwipe("maybe");
    else if (info.offset.x < -100) onSwipe("nope");
  }

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
      whileDrag={{ scale: 1.03 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', background: 'white' }}>
        
        {/* Image section */}
        <div style={{ position: 'relative', flexShrink: 0, height: '55%' }}>
          <img
            src={getImage(restaurant)}
            alt={restaurant.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />

          {/* Swipe hints */}
          <motion.div style={{ opacity: maybeOpacity, position: 'absolute', top: 24, left: 16 }}>
            <div style={{ background: '#4ade80', color: 'white', fontWeight: 900, fontSize: 24, padding: '8px 16px', borderRadius: 16, transform: 'rotate(-15deg)', border: '4px solid #86efac' }}>
              MAYBE! 🎉
            </div>
          </motion.div>
          <motion.div style={{ opacity: nopeOpacity, position: 'absolute', top: 24, right: 16 }}>
            <div style={{ background: '#f87171', color: 'white', fontWeight: 900, fontSize: 24, padding: '8px 16px', borderRadius: 16, transform: 'rotate(15deg)', border: '4px solid #fca5a5' }}>
              NOPE 👎
            </div>
          </motion.div>

          {restaurant.open_now !== undefined && (
            <div style={{
              position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
              background: restaurant.open_now ? '#22c55e' : '#ef4444',
              color: 'white', fontWeight: 700, fontSize: 12, padding: '4px 12px', borderRadius: 999
            }}>
              {restaurant.open_now ? '🟢 Open Now' : '🔴 Closed'}
            </div>
          )}
        </div>

        {/* Info section */}
        <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'white' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <h2 style={{ fontWeight: 900, fontSize: 22, color: '#111827', lineHeight: 1.2, margin: 0 }}>
                {restaurant.name}
              </h2>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#6b7280', marginLeft: 8, flexShrink: 0 }}>
                {PRICE_MAP[restaurant.price_level] || ''}
              </span>
            </div>
            <p style={{ fontWeight: 600, fontSize: 14, color: '#f97316', margin: '0 0 8px 0' }}>
              {restaurant.cuisine}
            </p>
            {restaurant.description && (
              <p style={{ fontSize: 13, color: '#6b7280', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {restaurant.description}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: '#6b7280', marginTop: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Star style={{ width: 14, height: 14, color: '#fbbf24', fill: '#fbbf24' }} />
              <span style={{ fontWeight: 700, color: '#111827' }}>{restaurant.rating || '?'}</span>
              {restaurant.review_count && <span>({restaurant.review_count})</span>}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin style={{ width: 14, height: 14 }} />
              {restaurant.distance || restaurant.address}
            </span>
            {restaurant.service_type && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock style={{ width: 14, height: 14 }} />
                {restaurant.service_type}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}