import { useState } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import { getImage } from "@/utils/foodImages";

export default function SwipeableFomoCard({ restaurant, onAddToMaybes, onViewDetail, isInMaybes }) {
  const [dismissed, setDismissed] = useState(false);
  const [added, setAdded] = useState(isInMaybes);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-150, 150], [-10, 10]);
  const opacity = useTransform(x, [-150, -80, 0, 80, 150], [0, 1, 1, 1, 0]);

  const greenOverlay = useTransform(x, [0, 100], [0, 0.6]);
  const redOverlay = useTransform(x, [-100, 0], [0.6, 0]);

  function handleDragEnd(_, info) {
    if (info.offset.x > 80) {
      // Swiped right — add to maybes
      handleAdd();
    } else if (info.offset.x < -80) {
      // Swiped left — dismiss
      setDismissed(true);
    }
  }

  function handleAdd() {
    if (!added) {
      setAdded(true);
      onAddToMaybes(restaurant);
    }
  }

  if (dismissed) return null;

  const imgSrc = getImage(restaurant);

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.02 }}
      className="relative cursor-grab active:cursor-grabbing"
    >
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex">
        {/* Image */}
        <div className="w-20 h-20 flex-shrink-0 relative">
          <img
            src={imgSrc}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex-1 px-3 py-2 min-w-0">
          <p className="font-black text-sm text-foreground truncate">{restaurant.name}</p>
          {restaurant.cuisine && (
            <p className="text-xs text-orange-500 font-semibold">{restaurant.cuisine}</p>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            {restaurant.rating > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-gray-500">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {restaurant.rating}
              </span>
            )}
            {restaurant.distance && (
              <span className="text-xs text-gray-400">📍 {restaurant.distance}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col justify-center gap-1 pr-3 pl-1">
          <button
            onClick={onViewDetail}
            className="text-xs text-teal-600 font-bold px-2 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 transition-all"
          >
            Info
          </button>
          <button
            onClick={handleAdd}
            disabled={added}
            className={`text-xs font-bold px-2 py-1 rounded-lg transition-all ${
              added
                ? 'bg-green-100 text-green-600'
                : 'bg-orange-50 text-orange-500 hover:bg-orange-100'
            }`}
          >
            {added ? '💚 Added' : '+ Maybe'}
          </button>
        </div>
      </div>

      {/* Swipe overlays */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none flex items-center justify-center"
        style={{ backgroundColor: 'rgb(16,185,129)', opacity: greenOverlay }}
      >
        <span className="text-white font-black text-lg">💚 Adding!</span>
      </motion.div>
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none flex items-center justify-center"
        style={{ backgroundColor: 'rgb(239,68,68)', opacity: redOverlay }}
      >
        <span className="text-white font-black text-lg">👎 Nope</span>
      </motion.div>
    </motion.div>
  );
}