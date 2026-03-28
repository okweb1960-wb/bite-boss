import { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, X, Zap } from "lucide-react";
import FilterSummary from "../components/FilterSummary";
import RestaurantCard from "../components/RestaurantCard";
import SkeletonCard from "../components/SkeletonCard";

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
    <div className="flex flex-col min-h-screen" style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #FF2D78 100%)' }}>
      {/* Filter Summary */}
      <FilterSummary filters={state.filters} location={state.location} onClear={() => navigate('/')} />

      {/* Header */}
      <div className="px-5 pt-6 pb-3 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <motion.div
          key={remaining}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <p className="text-white/80 text-xs font-semibold uppercase tracking-widest">Remaining</p>
          <p className="text-white font-black text-2xl">{remaining}</p>
        </motion.div>
        <div className="w-5" />
      </div>

      {/* Progress bar */}
      <div className="px-5 mb-4">
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-white rounded-full"
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
              {[2, 1].map((offset) => {
                const idx = currentIndex + offset;
                if (idx >= restaurants.length) return null;
                return (
                  <motion.div
                    key={idx}
                    className="absolute inset-0 rounded-3xl shadow-2xl bg-white"
                    initial={{ scale: 1 - offset * 0.04, y: offset * 12 }}
                    animate={{ scale: 1 - offset * 0.04, y: offset * 12 }}
                    transition={{ type: 'spring', damping: 20 }}
                    style={{ zIndex: 10 - offset }}
                  />
                );
              })}

              {/* Top card */}
              <AnimatePresence>
                {current ? (
                  <RestaurantCard
                    key={currentIndex}
                    restaurant={current}
                    onSwipe={handleSwipe}
                    onBlock={() => blockRestaurant(current.name)}
                    isTop={true}
                  />
                ) : (
                  <SkeletonCard key="skeleton" />
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-[480px] flex flex-col items-center justify-center text-center px-4"
          >
            <div className="text-7xl mb-4">🎊</div>
            <h2 className="font-playfair text-3xl font-bold text-white mb-2">You've seen it all!</h2>
            {noMore ? (
              <p className="text-white/80 font-semibold mb-4">No more restaurants nearby.</p>
            ) : (
              <p className="text-white/80 font-semibold mb-4">Want more options?</p>
            )}
            {!noMore && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="bg-white text-orange-500 font-black px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mb-3"
              >
                {loadingMore ? <>⏳ Loading...</> : '🔍 Show More'}
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-5 py-6 flex items-center justify-center gap-8">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleSwipe('nope')}
          disabled={allDone}
          className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center hover:shadow-2xl transition-shadow disabled:opacity-50"
        >
          <X className="w-8 h-8 text-red-500" strokeWidth={3} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            const pool = maybes.length > 0 ? maybes : restaurants.slice(currentIndex);
            if (pool.length > 0) {
              const pick = pool[Math.floor(Math.random() * pool.length)];
              navigate('/results', { state: { maybes: [pick], allRestaurants: restaurants } });
            }
          }}
          className="w-14 h-14 rounded-full bg-yellow-400 shadow-xl flex items-center justify-center hover:shadow-2xl transition-shadow"
        >
          <Zap className="w-7 h-7 text-white" fill="white" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleSwipe('maybe')}
          disabled={allDone}
          className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center hover:shadow-2xl transition-shadow disabled:opacity-50"
        >
          <Heart className="w-8 h-8 text-green-500" fill="currentColor" />
        </motion.button>
      </div>

      {/* Done button */}
      {!allDone && (
        <div className="px-5 pb-6 flex justify-center">
          <button
            onClick={() => navigate('/results', { state: { maybes, allRestaurants: restaurants } })}
            className="px-6 py-3 bg-white text-orange-500 font-black rounded-2xl shadow-lg hover:shadow-xl transition-all text-sm"
          >
            I'm Done Swiping
          </button>
        </div>
      )}
    </div>
  );
}