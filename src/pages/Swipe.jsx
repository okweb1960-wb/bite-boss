import { useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, List, ArrowLeft } from "lucide-react";
import RestaurantCard from "../components/RestaurantCard";

export default function Swipe() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const restaurants = state?.restaurants || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [maybes, setMaybes] = useState([]);
  const [lastAction, setLastAction] = useState(null);

  const current = restaurants[currentIndex];
  const remaining = restaurants.length - currentIndex;

  const handleSwipe = useCallback((direction) => {
    if (!current) return;
    if (direction === "maybe") {
      setMaybes(prev => [...prev, current]);
      setLastAction("maybe");
    } else {
      setLastAction("nope");
    }
    setCurrentIndex(prev => prev + 1);
    setTimeout(() => setLastAction(null), 600);
  }, [current]);

  const allDone = currentIndex >= restaurants.length;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="px-5 pt-6 pb-3 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="p-2 rounded-2xl bg-muted hover:bg-border transition-all">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="text-center">
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">Swiping</p>
          <p className="font-black text-foreground">{remaining} left to go</p>
        </div>
        <button
          onClick={() => navigate("/results", { state: { maybes, allRestaurants: restaurants } })}
          className="flex items-center gap-1.5 bg-muted px-3 py-2 rounded-2xl font-bold text-sm hover:bg-border transition-all"
        >
          <List className="w-4 h-4" />
          <span className="text-primary font-black">{maybes.length}</span>
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-5 mb-4">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
            animate={{ width: `${(currentIndex / restaurants.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 px-5 relative">
        {!allDone ? (
          <>
            <div className="relative" style={{ height: '480px' }}>
              {/* Stack preview cards */}
              {[2, 1].map(offset => {
                const idx = currentIndex + offset;
                if (idx >= restaurants.length) return null;
                return (
                  <div
                    key={idx}
                    className="absolute inset-0 rounded-3xl shadow-lg" style={{ background: 'white', zIndex: 10 - offset }}
                    style={{
                      transform: `scale(${1 - offset * 0.04}) translateY(${offset * 8}px)`,
                      zIndex: 10 - offset,
                    }}
                  />
                );
              })}

              {/* Top card */}
              <AnimatePresence>
                {current && (
                  <RestaurantCard
                    key={currentIndex}
                    restaurant={current}
                    onSwipe={handleSwipe}
                    isTop={true}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Feedback flash */}
            <AnimatePresence>
              {lastAction && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
                >
                  <div className={`text-6xl ${lastAction === "maybe" ? "" : ""}`}>
                    {lastAction === "maybe" ? "🎉" : "👎"}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-[480px] flex flex-col items-center justify-center text-center"
          >
            <div className="text-7xl mb-4">🍽️</div>
            <h2 className="font-playfair text-3xl font-bold text-foreground mb-2">That's all of them!</h2>
            <p className="text-muted-foreground font-semibold">You liked <span className="text-primary font-black">{maybes.length}</span> places.</p>
          </motion.div>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-5 py-6 flex items-center justify-center gap-6">
        <button
          onClick={() => handleSwipe("nope")}
          disabled={allDone}
          className="w-16 h-16 rounded-full bg-card shadow-lg border-2 border-red-200 flex items-center justify-center hover:scale-110 hover:border-red-400 transition-all active:scale-95 disabled:opacity-30"
        >
          <X className="w-7 h-7 text-red-400" />
        </button>

        <button
          onClick={() => navigate("/results", { state: { maybes, allRestaurants: restaurants } })}
          className="px-6 py-3 bg-gradient-to-r from-primary to-orange-400 text-white font-black rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm"
        >
          {allDone ? "See My Picks! 🎉" : "I'm Done, Show Me"}
        </button>

        <button
          onClick={() => handleSwipe("maybe")}
          disabled={allDone}
          className="w-16 h-16 rounded-full bg-card shadow-lg border-2 border-green-200 flex items-center justify-center hover:scale-110 hover:border-green-400 transition-all active:scale-95 disabled:opacity-30"
        >
          <Heart className="w-7 h-7 text-green-400" />
        </button>
      </div>

      {/* Hint */}
      {!allDone && (
        <p className="text-center text-muted-foreground text-xs font-semibold pb-4">
          ← Swipe left to skip &nbsp;|&nbsp; Swipe right to maybe →
        </p>
      )}
    </div>
  );
}