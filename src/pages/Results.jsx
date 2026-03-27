import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shuffle, Star, MapPin, Ban, Heart } from "lucide-react";
import confetti from "canvas-confetti";

const PRICE_MAP = { 1: "$", 2: "$$", 3: "$$$", 4: "$$$$" };

function getBlocked() {
  try { return JSON.parse(localStorage.getItem('blockedRestaurants') || '[]'); } catch { return []; }
}

function WinnerModal({ restaurant, onClose, onGoHome }) {
  useState(() => {
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ["#f97316", "#fb923c", "#fbbf24", "#f43f5e"] });
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.5, y: 100 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.5, y: 100 }}
        transition={{ type: "spring", damping: 15 }}
        className="bg-card rounded-3xl overflow-hidden shadow-2xl max-w-sm w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-primary to-secondary p-6 text-center">
          <div className="text-5xl mb-2">🎰</div>
          <h2 className="font-playfair text-3xl font-bold text-white">You're going to...</h2>
        </div>
        <div className="p-6 text-center space-y-3">
          <h3 className="font-black text-3xl text-foreground">{restaurant.name}</h3>
          <p className="text-primary font-bold">{restaurant.cuisine}</p>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            {restaurant.rating && (
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-secondary fill-secondary" />
                <span className="font-bold text-foreground">{restaurant.rating}</span>
              </span>
            )}
            {restaurant.address && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {restaurant.address}
              </span>
            )}
            {restaurant.price_level && <span className="font-bold">{PRICE_MAP[restaurant.price_level]}</span>}
          </div>
          <button
            onClick={onGoHome}
            className="w-full bg-gradient-to-r from-primary to-orange-400 text-white font-black py-4 rounded-2xl mt-2 hover:opacity-90 transition-all text-lg"
          >
            Let's Go! 🚀
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function RestaurantRow({ r, onBlock, onSelect }) {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border flex gap-3 items-center">
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onSelect}>
        <h3 className="font-black text-foreground text-base truncate">{r.name}</h3>
        <p className="text-primary font-semibold text-sm">{r.cuisine}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
          {r.rating && (
            <span className="flex items-center gap-0.5">
              <Star className="w-3 h-3 text-secondary fill-secondary" />
              <span className="font-bold text-foreground">{r.rating}</span>
            </span>
          )}
          {r.address && <span>{r.address}</span>}
          {r.price_level && <span className="font-bold">{PRICE_MAP[r.price_level]}</span>}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        {r.open_now !== undefined && (
          <div className={`text-xs font-bold px-2 py-1 rounded-full ${r.open_now ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {r.open_now ? "Open" : "Closed"}
          </div>
        )}
        <button onClick={onBlock} className="p-1.5 rounded-full hover:bg-red-50 transition-all" title="Never show again">
          <Ban className="w-4 h-4 text-gray-300 hover:text-red-400" />
        </button>
      </div>
    </div>
  );
}

export default function Results() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const allRestaurants = state?.allRestaurants || [];
  const initialMaybes = state?.maybes || [];

  if (!state) {
    navigate("/", { replace: true });
    return null;
  }

  const [blocked, setBlocked] = useState(getBlocked());
  const [maybes, setMaybes] = useState(initialMaybes.filter(r => !getBlocked().includes(r.name)));
  const [winner, setWinner] = useState(null);
  const [spinning, setSpinning] = useState(false);

  const others = allRestaurants.filter(r =>
    !blocked.includes(r.name) && !maybes.find(m => m.name === r.name)
  );

  function blockRestaurant(name) {
    const updated = [...blocked, name];
    setBlocked(updated);
    localStorage.setItem('blockedRestaurants', JSON.stringify(updated));
    setMaybes(prev => prev.filter(r => r.name !== name));
  }

  function pickForMe() {
    const pool = maybes.length > 0 ? maybes : others;
    if (pool.length === 0) return;
    setSpinning(true);
    let count = 0;
    const interval = setInterval(() => {
      count++;
      if (count > 15) {
        clearInterval(interval);
        const pick = pool[Math.floor(Math.random() * pool.length)];
        setWinner(pick);
        setSpinning(false);
      }
    }, 80);
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary via-orange-400 to-secondary px-5 pt-6 pb-8 rounded-b-[2.5rem] shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-2xl bg-white/20 hover:bg-white/30 transition-all">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">Your Picks</p>
            <h1 className="font-playfair text-2xl font-bold text-white">
              {maybes.length > 0 ? `${maybes.length} maybe${maybes.length !== 1 ? "s" : ""}` : "No maybes yet"}
            </h1>
          </div>
        </div>

        <button
          onClick={pickForMe}
          disabled={spinning || (maybes.length === 0 && others.length === 0)}
          className="w-full bg-white text-primary font-black text-lg py-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <Shuffle className={`w-5 h-5 ${spinning ? "animate-spin" : ""}`} />
          {spinning ? "Picking..." : "🎰 Pick For Me!"}
        </button>
        {maybes.length > 0 && (
          <p className="text-white/60 text-xs text-center mt-2 font-semibold">Picks from your maybes</p>
        )}
      </div>

      <div className="flex-1 px-5 py-5 overflow-y-auto space-y-5">
        {/* Maybes section */}
        {maybes.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-green-500 fill-green-500" />
              <h2 className="font-black text-foreground">Your Maybes</h2>
            </div>
            <div className="space-y-3">
              {maybes.map((r, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                  <RestaurantRow r={r} onBlock={() => blockRestaurant(r.name)} onSelect={() => setWinner(r)} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* All others */}
        {others.length > 0 && (
          <div>
            <h2 className="font-black text-foreground mb-3 text-sm text-muted-foreground uppercase tracking-wide">
              All Others ({others.length})
            </h2>
            <div className="space-y-3">
              {others.map((r, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                  <RestaurantRow r={r} onBlock={() => blockRestaurant(r.name)} onSelect={() => setWinner(r)} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {maybes.length === 0 && others.length === 0 && (
          <div className="text-center py-10">
            <div className="text-6xl mb-4">😬</div>
            <p className="font-bold text-foreground text-xl mb-2">No restaurants left!</p>
            <p className="text-muted-foreground font-semibold mb-6">You've blocked everything.</p>
            <button
              onClick={() => { localStorage.removeItem('blockedRestaurants'); setBlocked([]); }}
              className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-2xl hover:opacity-90 transition-all"
            >
              Clear Block List
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {winner && <WinnerModal restaurant={winner} onClose={() => setWinner(null)} onGoHome={() => navigate("/")} />}
      </AnimatePresence>
    </div>
  );
}