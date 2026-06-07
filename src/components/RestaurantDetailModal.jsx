import { motion, AnimatePresence } from "framer-motion";
import { X, Star, MapPin } from "lucide-react";
import { getImage } from "@/utils/foodImages";

const PRICE_MAP = { 1: "$", 2: "$$", 3: "$$$", 4: "$$$$" };

export default function RestaurantDetailModal({ restaurant, onClose, onSelect }) {
  if (!restaurant) return null;

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
  } = restaurant;

  const priceLevel = price_level ? PRICE_MAP[price_level] : null;
  const hasDineIn = restaurant?.dineIn || restaurant?.dine_in;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full bg-white flex flex-col overflow-hidden"
          style={{ borderRadius: "24px 24px 0 0", maxHeight: "90vh" }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all z-10"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1">
            {/* Photo */}
            <div className="relative w-full" style={{ height: "200px" }}>
              <img
                src={getImage(restaurant)}
                alt={name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)" }} />
              {open_now === true && (
                <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-green-500 text-white text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
                  Open Now
                </div>
              )}
            </div>

            {/* Info */}
            <div className="px-5 py-5 space-y-3">
              <div className="flex items-start justify-between">
                <h2 className="font-black text-2xl text-foreground leading-tight flex-1">{name}</h2>
                {priceLevel && (
                  <span className="text-sm font-bold text-teal-600 ml-2 shrink-0">{priceLevel}</span>
                )}
              </div>

              {cuisine && (
                <p className="text-orange-500 font-semibold text-sm">{cuisine}</p>
              )}

              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                {rating && (
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4" style={{ fill: "#f59e0b", color: "#f59e0b" }} />
                    <span className="font-bold text-foreground">{rating}</span>
                    {review_count && <span>({review_count})</span>}
                  </span>
                )}
                {distance && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {distance}
                  </span>
                )}
              </div>

              {description && (
                <p className="text-sm text-gray-500 italic leading-relaxed">{description}</p>
              )}

              {address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " " + address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-500 text-sm font-medium hover:underline"
                >
                  <MapPin className="w-4 h-4 shrink-0" />
                  {address}
                </a>
              )}

              {(takeout || delivery || hasDineIn) && (
                <div className="flex gap-2 flex-wrap">
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

          {/* Action buttons */}
          <div className="px-5 py-4 border-t border-gray-100 flex gap-3 shrink-0">
            <button
              onClick={onClose}
              className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-all text-sm"
            >
              Back to Maybes
            </button>
            <button
              onClick={() => onSelect(restaurant)}
              className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all text-sm"
            >
              Add to Maybes 💚
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}