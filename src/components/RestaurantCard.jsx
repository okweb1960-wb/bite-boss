import { motion, useMotionValue, useTransform } from "framer-motion";
import { Star, Clock, MapPin, DollarSign } from "lucide-react";

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

  const imgSrc = getImage(restaurant);

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      whileDrag={{ scale: 1.03 }}
    >
      <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-white flex flex-col">
        {/* Image */}
        <div className="relative flex-shrink-0" style={{ height: '55%' }}>
          <img src={imgSrc} alt={restaurant.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          <motion.div
            style={{ opacity: maybeOpacity }}
            className="absolute top-8 left-6 bg-green-400 text-white font-black text-3xl px-4 py-2 rounded-2xl rotate-[-15deg] border-4 border-green-300"
          >
            MAYBE! 🎉
          </motion.div>
          <motion.div
            style={{ opacity: nopeOpacity }}
            className="absolute top-8 right-6 bg-red-400 text-white font-black text-3xl px-4 py-2 rounded-2xl rotate-[15deg] border-4 border-red-300"
          >
            NOPE 👎
          </motion.div>

          {restaurant.open_now !== undefined && (
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold ${
              restaurant.open_now ? "bg-green-500 text-white" : "bg-red-500 text-white"
            }`}>
              {restaurant.open_now ? "🟢 Open Now" : "🔴 Closed"}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 p-5 flex flex-col justify-between bg-white">
          <div>
            <div className="flex justify-between items-start mb-1">
              <h2 className="font-black text-2xl text-gray-900 leading-tight">{restaurant.name || "Restaurant"}</h2>
              <span className="text-gray-500 font-bold text-sm ml-2 shrink-0">{PRICE_MAP[restaurant.price_level] || ""}</span>
            </div>
            <p className="text-orange-500 font-semibold text-sm mb-2">{restaurant.cuisine || ""}</p>
            {restaurant.description && (
              <p className="text-gray-500 text-sm line-clamp-2">{restaurant.description}</p>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="font-bold text-gray-900">{restaurant.rating || "?"}</span>
              {restaurant.review_count && <span>({restaurant.review_count})</span>}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {restaurant.distance || restaurant.address || ""}
            </span>
            {restaurant.service_type && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {restaurant.service_type}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}