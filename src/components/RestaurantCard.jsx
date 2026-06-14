import { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Ban, Star, MapPin, Clock, ExternalLink } from "lucide-react";
import { getImage } from "@/utils/foodImages";

const PRICE_MAP = { 1: "$", 2: "$$", 3: "$$$", 4: "$$$$" };

function getPriceDisplay(price_level) {
  if (!price_level) return null;
  const map = { 1: "$", 2: "$$", 3: "$$$", 4: "$$$$" };
  return map[price_level] || map[price_level.toString()];
}

export default function RestaurantCard({ restaurant, onSwipe, onBlock, isTop }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { name = 'Unknown', cuisine, address, rating, review_count, price_level, open_now, description, photo_url, distance, delivery, takeout } = restaurant || {};
  const hasTakeout = takeout;
  const hasDelivery = delivery;
  const hasDineIn = restaurant?.dineIn || restaurant?.dine_in;
  const hasSportsTV = restaurant?.good_for_sports;
  const priceLevel = price_level ? PRICE_MAP[price_level] || PRICE_MAP[price_level.toString()] : null;
  const isOpen = open_now;
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);

  function handleDragEnd(_, info) {
    if (info.offset.x > 100) onSwipe("maybe");
    else if (info.offset.x < -100) onSwipe("nope");
    else x.set(0);
  }

  if (!restaurant) return null;

  const imgSrc = getImage(restaurant);
  const hasRealPhoto = !!restaurant.photo_url;

  return (
    <motion.div
      style={{ x, rotate }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.03 }}
      className="absolute inset-0 z-20 cursor-grab active:cursor-grabbing"
    >
      <div className="w-full h-full rounded-3xl shadow-2xl" style={{ background: '#ffffff', position: 'relative', overflow: 'visible' }}>

        {/* Photo */}
        <div className="relative w-full" style={{ height: '220px', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
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



          {/* No photo yet badge */}
          {!hasRealPhoto && imageLoaded && (
            <div className="absolute bottom-3 left-3 px-2 py-1 rounded-full text-xs font-semibold text-white"
              style={{ background: 'rgba(0, 0, 0, 0.6)' }}>
              📷 No photo yet
            </div>
          )}
        </div>
        <div className="px-5 py-5" style={{ background: '#ffffff', position: 'relative', zIndex: 1 }}>
          {/* Open Now Badge */}
          {isOpen === true && (
            <div style={{ display: 'inline-flex', alignItems: 'center', background: '#10B981', color: 'white', borderRadius: '20px', padding: '4px 10px', fontSize: '12px', fontWeight: '600', marginBottom: '8px', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', background: '#ffffff', borderRadius: '50%', display: 'inline-block' }}></span>
              Open Now
            </div>
          )}
          {/* Row 1: Name + Price */}
          <div className="flex items-start justify-between mb-1">
            <h2 className="font-black leading-tight" style={{ fontSize: '22px', color: '#111827', margin: 0, flex: 1 }}>{name}</h2>
            {restaurant.price_level
              ? <span className="font-bold ml-2 shrink-0" style={{ color: '#059669', fontSize: '14px' }}>{getPriceDisplay(restaurant.price_level)}</span>
              : <span className="ml-2 shrink-0" style={{ color: '#9CA3AF', fontSize: '12px' }}>–</span>
            }
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
          {(hasTakeout || hasDelivery || hasDineIn || hasSportsTV) && (
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {hasTakeout && <span style={{ background: '#F3F4F6', color: '#6B7280', fontSize: '11px', padding: '4px 8px', borderRadius: '12px', fontWeight: 500 }}>🥡 Takeout</span>}
              {hasDelivery && <span style={{ background: '#F3F4F6', color: '#6B7280', fontSize: '11px', padding: '4px 8px', borderRadius: '12px', fontWeight: 500 }}>🚗 Delivery</span>}
              {hasDineIn && <span style={{ background: '#F3F4F6', color: '#6B7280', fontSize: '11px', padding: '4px 8px', borderRadius: '12px', fontWeight: 500 }}>🍽️ Dine-in</span>}
              {hasSportsTV && <span style={{ background: '#EFF6FF', color: '#3B82F6', fontSize: '11px', padding: '4px 8px', borderRadius: '12px', fontWeight: 500 }}>📺 Sports TV</span>}
            </div>
          )}

          {/* Row 6: CTA + Block */}
          <div className="flex items-center justify-between">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + address)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 font-semibold"
              style={{ color: '#4285F4', fontSize: '12px', textDecoration: 'none' }}
            >
              <MapPin style={{ width: 12, height: 12, flexShrink: 0 }} />
              {address}
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