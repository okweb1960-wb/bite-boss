import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Star, MapPin, ExternalLink, Ban } from 'lucide-react';

const PRICE_MAP = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };

const FOOD_IMAGES = {
  mexican: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
  italian: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
  pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
  sushi: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80',
  japanese: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800&q=80',
  chinese: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80',
  burgers: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
  bbq: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&q=80',
  sandwiches: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80',
  thai: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&q=80',
  indian: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  seafood: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&q=80',
  breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80',
  american: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&q=80',
  default: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
};

function getImage(restaurant) {
  const cuisine = (restaurant?.cuisine || '').toLowerCase();
  for (const key of Object.keys(FOOD_IMAGES)) {
    if (cuisine.includes(key)) return FOOD_IMAGES[key];
  }
  return FOOD_IMAGES.default;
}

export default function RestaurantCard({ restaurant, onSwipe, onBlock, isTop }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  function handleDragEnd(_, info) {
    if (info.offset.x > 100) onSwipe('maybe');
    else if (info.offset.x < -100) onSwipe('nope');
  }

  if (!restaurant) return null;

  const imgSrc = getImage(restaurant);
  const name = restaurant.name || 'Unknown';
  const cuisine = restaurant.cuisine || '';
  const rating = restaurant.rating;
  const reviewCount = restaurant.review_count;
  const priceLevel = PRICE_MAP[restaurant.price_level] || '';
  const distance = restaurant.distance || '';
  const description = restaurant.description || '';
  const isOpen = restaurant.open_now;

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.02 }}
      initial={{ scale: 0.95, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="absolute inset-0 z-20 cursor-grab active:cursor-grabbing"
    >
      <div className="w-full h-full rounded-3xl overflow-hidden bg-white shadow-2xl flex flex-col">
        {/* Photo Section - 60% */}
        <div className="relative flex-1 bg-gray-200 overflow-hidden">
          <img src={imgSrc} alt={name} className="w-full h-full object-cover" crossOrigin="anonymous" />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {/* Cuisine Badge - Top Left */}
          {cuisine && (
            <div className="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              {cuisine}
            </div>
          )}

          {/* Open Now Badge - Top Right */}
          {isOpen && (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute top-3 right-3 w-3 h-3 bg-green-500 rounded-full shadow-lg"
            />
          )}

          {/* Restaurant Name - Bottom */}
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="font-black text-white text-2xl leading-tight drop-shadow-lg">{name}</h2>
          </div>
        </div>

        {/* Info Section - 40% */}
        <div className="p-5 space-y-3 bg-white flex-shrink-0">
          {/* Rating & Reviews */}
          {rating && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-orange-500 text-orange-500" />
                <span className="font-bold text-foreground text-sm">{rating}</span>
              </div>
              {reviewCount && <span className="text-xs text-muted-foreground">({reviewCount})</span>}
              {priceLevel && <span className="text-xs font-semibold text-green-600">{priceLevel}</span>}
            </div>
          )}

          {/* Distance */}
          {distance && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{distance}</span>
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="text-xs text-muted-foreground italic line-clamp-2">{description}</p>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-blue-500 text-xs font-semibold hover:underline"
            >
              <ExternalLink className="w-3 h-3" /> Maps
            </a>
            {onBlock && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBlock();
                }}
                className="p-1 rounded-full hover:bg-red-50 transition-all"
                title="Never show again"
              >
                <Ban className="w-4 h-4 text-gray-300 hover:text-red-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}