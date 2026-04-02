import { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCcw } from "lucide-react";
import RestaurantCard from "../components/RestaurantCard";
import { haptics } from "@/utils/haptics";

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
  const [lastSwiped, setLastSwiped] = useState(null);
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
    if (direction === "maybe") {
      haptics.maybe();
      setMaybes(prev => [...prev, current]);
    } else {
      haptics.nope();
    }
    setLastSwiped({ restaurant: current, direction });
    setLastAction(direction);
    setCurrentIndex(prev => prev + 1);
    setTimeout(() => setLastAction(null), 600);
  }, [current]);

  const handleUndo = useCallback(() => {
    if (!lastSwiped) return;
    haptics.undo();
    if (lastSwiped.direction === "maybe") {
      setMaybes(prev => prev.filter(r => r.name !== lastSwiped.restaurant.name));
    }
    setCurrentIndex(prev => prev - 1);
    setLastSwiped(null);
  }, [lastSwiped]);

  const handleStartOver = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const allDone = currentIndex >= restaurants.length;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header with Maybe Count */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between border-b border-gray-200">
        <button onClick={() => navigate("/")} className="p-2 rounded-2xl bg-gray-200 hover:bg-gray-300 transition-all">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex items-center gap-4">
          <motion.span className="text-sm font-bold text-green-600" key={maybes.length} initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
            💚 {maybes.length}
          </motion.span>
          <p className="text-muted-foreground text-xs font-semibold">{remaining} left</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-5 py-3">
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-teal-600 rounded-full"
            animate={{ width: `${(currentIndex / restaurants.length) * 100}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-center">{currentIndex} of {restaurants.length}</p>
      </div>

      {/* Swipe Controls */}
      <div className="px-5 pt-4 pb-4 flex items-center justify-center gap-3 border-b border-gray-200">
        <button
          onClick={() => handleSwipe("nope")}
          disabled={allDone}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-white text-sm shadow-lg active:scale-95 transition-all disabled:opacity-30"
          style={{ background: '#EF4444', boxShadow: '0 4px 15px rgba(239,68,68,0.4)' }}
        >
          Nope
        </button>
        <button
          onClick={handleUndo}
          disabled={!lastSwiped || allDone}
          className="p-2.5 rounded-full border-2 border-teal-600 bg-white hover:bg-teal-50 transition-all disabled:opacity-30 disabled:border-gray-300"
          title="Undo last swipe"
        >
          <span className="text-teal-600 text-lg font-bold disabled:text-gray-400">↩</span>
        </button>
        <button
          onClick={() => handleSwipe("maybe")}
          disabled={allDone}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-white text-sm shadow-lg active:scale-95 transition-all disabled:opacity-30"
          style={{ background: '#10B981', boxShadow: '0 4px 15px rgba(16,185,129,0.4)' }}
        >
          Maybe
        </button>
      </div>

      <div className="flex-1 px-5 relative flex items-center justify-center">
        {!allDone ? (
          <>
            <div className="relative w-full" style={{ maxWidth: '400px', minHeight: '600px' }}>
              {/* Stack preview cards */}
              {[2, 1].map(offset => {
                const idx = currentIndex + offset;
                if (idx >= restaurants.length) return null;
                return (
                  <div
                    key={idx}
                    className="absolute inset-0 rounded-3xl shadow-lg"
                    style={{
                      background: 'white',
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
            className="min-h-[600px] flex flex-col items-center justify-center text-center px-4 w-full"
          >
            <div className="text-7xl mb-4">🍽️</div>
            <h2 className="font-playfair text-3xl font-bold text-foreground mb-2">That's all of them!</h2>
            {noMore ? (
              <p className="text-muted-foreground font-semibold mb-4">No more restaurants to show nearby.</p>
            ) : (
              <p className="text-muted-foreground font-semibold mb-4">Want to see more options?</p>
            )}
            {maybes.length > 0 && (
              <button
                onClick={() => navigate("/results", { state: { maybes, allRestaurants: restaurants } })}
                className="bg-green-600 text-white font-black px-8 py-4 rounded-2xl shadow-lg hover:opacity-90 transition-all flex items-center gap-2 mb-3 text-lg"
              >
                View Your {maybes.length} Maybes 💚
              </button>
            )}
            <button
              onClick={() => navigate("/")}
              className="text-teal-700 font-bold px-8 py-3 rounded-2xl border-2 border-teal-600 hover:bg-teal-50 transition-all text-base"
            >
              🔄 Start Over & Adjust Filters
            </button>
          </motion.div>
        )}
      </div>


    </div>
  );
}