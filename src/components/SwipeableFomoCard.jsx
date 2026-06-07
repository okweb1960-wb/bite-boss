import { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Star, MapPin } from "lucide-react";
import { haptics } from "@/utils/haptics";
import { getImage } from "@/utils/foodImages";

const PRICE_MAP = { 1: "$", 2: "$$", 3: "$$$", 4: "$$$$" };

export default function SwipeableFomoCard({ restaurant, onAddToMaybes, onViewDetail, isInMaybes, isVisible }) {
  const [dismissed, setDismissed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-8, 8]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const greenOpacity = useTransform(x, [0, 100], [0, 1]);
  const redOpacity = useTransform(x, [-100, 0], [1, 0]);

  const {
    name = "Unknown", cuisine, rating, review_count,
    price_level, open_now, distance, delivery, takeout
  } = restaurant || {};

  const priceLevel = price_level ? PRICE_MAP[price_level] : null;
  const hasDineIn = restaurant?.dineIn || restaurant?.dine_in;

  function handleDragEnd(_, info) {
    if (info.offset.x > 100) {
      haptics.maybe();
      onAddToMaybes(restaurant);
    } else if (info.offset.x < -100) {
      haptics.nope();
      setDismissed(true);
    }
  }

  function handleAddButton(e) {
    e.stopPropagation();
    if (!isInMaybes) {
      haptics.maybe();
      onAddToMaybes(restaurant);
    }
  }

  if (dismissed) return null;

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag={isVisible ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.02 }}
      className="relative bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden cursor-grab active:cursor-grabbing"
      onClick={onViewDetail}
    >
      {/* Swipe indicators */}
      <motion.div
        style={{ opacity: greenOpacity }}
        className="absolute inset-0 bg-green-400/20 z-10 rounded-2xl flex items-center justify-start pl-6 pointer-events-none"
      >
        <span className="text-green-600 font-black text-2xl">+ Maybes 💚</span>
      </motion.div>
      <motion.div
        style={{ opacity: redOpacity }}
        className="absolute inset-0 bg-red-400/20 z-10 rounded-2xl flex items-center justify-end pr-6 pointer-events-none"
      >
        <span className="text-red-500 font-black text-2xl">Nope 👎</span>
      </motion.div>

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
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-white text-xs font-semibold" style={{ background: "#10B981" }}>
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

        {cuisine && <p className="text-orange-500 font-semibold text-sm mb-2">{cuisine}</p>}

        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
          {rating && (
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3" style={{ fill: "#f59e0b", color: "#f59e0b" }} />
              <span className="font-bold text-gray-700">{rating}</span>
              {review_count && <span>({review_count})</span>}
            </span>
          )}
          {distance && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />{distance}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5 flex-wrap">
            {takeout && <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">🥡 Takeout</span>}
            {delivery && <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">🚗 Delivery</span>}
            {hasDineIn && <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">🍽️ Dine-in</span>}
          </div>
          <button
            onClick={handleAddButton}
            className={`ml-2 shrink-0 px-3 py-1.5 rounded-full font-bold text-xs transition-all ${
              isInMaybes
                ? "bg-green-100 text-green-600 border border-green-300"
                : "bg-teal-600 text-white hover:bg-teal-700"
            }`}
          >
            {isInMaybes ? "✓ Added" : "+ Maybes"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}