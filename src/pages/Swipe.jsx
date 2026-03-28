import { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import RestaurantCard from "../components/RestaurantCard";

export default function Swipe() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const allRaw = state?.restaurants || [];
  const blocked = (() => { try { return JSON.parse(localStorage.getItem('blockedRestaurants') || '[]'); } catch { return []; } })();
  const initialRestaurants = allRaw.filter(r => !blocked.includes(r.name));

  const [restaurants, setRestaurants] = useState(initialRestaurants);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [maybes, setMaybes] = useState([]);
  const [lastAction, setLastAction] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [noMore, setNoMore] = useState(false);

  function getBlocked() {
    try { return JSON.parse(localStorage.getItem('blockedRestaurants') || '[]'); } catch { return []; }
  }

  async function loadMore() {
    setLoadingMore(true);
    setNoMore(false);
    try {
      const seenNames = restaurants.map(r => r.name);
      const response = await base44.functions.invoke('findRestaurants', {
        latitude: state.coords?.latitude,
        longitude: state.coords?.longitude,
        radius_miles: state.filters?.radius,
        cuisine: state.filters?.cuisines,
        service: state.filters?.services,
        open_now: state.filters?.openNow,
        exclude: seenNames,
      });
      const newOnes = (response.data?.restaurants || []).filter(r => !getBlocked().includes(r.name));
      if (newOnes.length === 0) {
        setNoMore(true);
      } else {
        setRestaurants(prev => [...prev, ...newOnes]);
      }
    } catch (e) {
      setNoMore(true);
    }
    setLoadingMore(false);
  }

  function blockRestaurant(name) {
    const blocked = getBlocked();
    if (!blocked.includes(name)) {
      localStorage.setItem('blockedRestaurants', JSON.stringify([...blocked, name]));
    }
    setCurrentIndex(prev => prev + 1);
    setLastAction('block');
    setTimeout(() => setLastAction(null), 600);
  }

  const current = restaurants[currentIndex];
  const remaining = restaurants.length - currentIndex;

  const handleSwipe = useCallback((direction) => {
    if (!current) return;
    if (navigator.vibrate) navigator.vibrate(50);
    if (direction === "maybe") setMaybes(prev => [...prev, current]);
    setLastAction(direction);
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
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleSwipe("nope")}
            disabled={allDone}
            className="flex flex-col items-center gap-0.5 disabled:opacity-30"
          >
            <ChevronLeft className="w-10 h-10 text-red-400" />
            <span className="text-xs font-bold text-red-400">Nope</span>
          </button>
          <span className="text-xs font-semibold text-muted-foreground text-center leading-tight">Swipe<br/>or Click</span>
          <button
            onClick={() => handleSwipe("maybe")}
            disabled={allDone}
            className="flex flex-col items-center gap-0.5 disabled:opacity-30"
          >
            <ChevronRight className="w-10 h-10 text-green-500" />
            <span className="text-xs font-bold text-green-500">Maybe</span>
          </button>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground text-xs font-semibold">{remaining} left</p>
        </div>
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
                    onBlock={() => blockRestaurant(current.name)}
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
            className="h-[480px] flex flex-col items-center justify-center text-center px-4"
          >
            <div className="text-7xl mb-4">🍽️</div>
            <h2 className="font-playfair text-3xl font-bold text-foreground mb-2">That's all of them!</h2>
            {noMore ? (
              <p className="text-muted-foreground font-semibold mb-4">No more restaurants to show nearby.</p>
            ) : (
              <p className="text-muted-foreground font-semibold mb-4">Want to see more options?</p>
            )}
            {!noMore && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="bg-secondary text-secondary-foreground font-black px-6 py-3 rounded-2xl shadow hover:opacity-90 transition-all flex items-center gap-2 mb-3"
              >
                {loadingMore ? <>🔄 Loading more...</> : "🔍 Show Me More"}
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-5 py-4 flex items-center justify-center">
        <button
          onClick={() => navigate("/results", { state: { maybes, allRestaurants: restaurants } })}
          className="px-5 py-3 bg-gradient-to-r from-primary to-orange-400 text-white font-black rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm"
        >
          {allDone ? "See My Picks! 🎉" : "I'm Done"}
        </button>
      </div>
    </div>
  );
}