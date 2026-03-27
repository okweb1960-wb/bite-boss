import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shuffle, Star, MapPin, DollarSign } from "lucide-react";
import confetti from "canvas-confetti";

const PRICE_MAP = { 1: "$", 2: "$$", 3: "$$$", 4: "$$$$" };

function WinnerModal({ restaurant, onClose }) {
  useEffect(() => {
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ["#f97316", "#fb923c", "#fbbf24", "#f43f5e"] });
  }, []);

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
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-secondary fill-secondary" />
              <span className="font-bold text-foreground">{restaurant.rating}</span>
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" /> {restaurant.distance || restaurant.address}
            </span>
            <span className="font-bold">{PRICE_MAP[restaurant.price_level]}</span>
          </div>
          {restaurant.description && (
            <p className="text-muted-foreground text-sm">{restaurant.description}</p>
          )}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-primary to-orange-400 text-white font-black py-4 rounded-2xl mt-2 hover:opacity-90 transition-all text-lg"
          >
            Let's Go! 🚀
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Results() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const maybes = state?.maybes || [];

  const [winner, setWinner] = useState(null);
  const [spinning, setSpinning] = useState(false);

  function pickForMe() {
    if (maybes.length === 0) return;
    setSpinning(true);
    let count = 0;
    const interval = setInterval(() => {
      count++;
      if (count > 15) {
        clearInterval(interval);
        const pick = maybes[Math.floor(Math.random() * maybes.length)];
        setWinner(pick);
        setSpinning(false);
      }
    }, 80);
  }

  const displayList = maybes.length > 0 ? maybes : (state?.allRestaurants || []);
  const isEmpty = maybes.length === 0;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary via-orange-400 to-secondary px-5 pt-6 pb-8 rounded-b-[2.5rem] shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate("/")} className="p-2 rounded-2xl bg-white/20 hover:bg-white/30 transition-all">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">Your Picks</p>
            <h1 className="font-playfair text-2xl font-bold text-white">
              {isEmpty ? "No maybes yet" : `${maybes.length} restaurant${maybes.length !== 1 ? "s" : ""} you liked`}
            </h1>
          </div>
        </div>

        <button
          onClick={pickForMe}
          disabled={spinning || displayList.length === 0}
          className="w-full bg-white text-primary font-black text-lg py-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <Shuffle className={`w-5 h-5 ${spinning ? "animate-spin" : ""}`} />
          {spinning ? "Picking..." : "🎰 Pick For Me!"}
        </button>
      </div>

      {/* List */}
      <div className="flex-1 px-5 py-5 overflow-y-auto space-y-3">
        {isEmpty && (
          <div className="text-center py-10">
            <div className="text-6xl mb-4">😬</div>
            <p className="font-bold text-foreground text-xl mb-2">No maybes saved!</p>
            <p className="text-muted-foreground font-semibold mb-6">Go back and swipe right on places you like</p>
            <button
              onClick={() => navigate(-1)}
              className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-2xl hover:opacity-90 transition-all"
            >
              Back to Swiping
            </button>
          </div>
        )}

        {displayList.map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setWinner(r)}
            className="bg-card rounded-2xl p-4 shadow-sm border border-border flex gap-4 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all active:scale-[0.99]"
          >
            <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden shrink-0">
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-2xl">
                🍴
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-foreground text-base truncate">{r.name}</h3>
              <p className="text-primary font-semibold text-sm">{r.cuisine}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 text-secondary fill-secondary" />
                  <span className="font-bold text-foreground">{r.rating}</span>
                </span>
                <span>{r.distance || r.address}</span>
                <span className="font-bold">{PRICE_MAP[r.price_level]}</span>
              </div>
            </div>
            {r.open_now !== undefined && (
              <div className={`shrink-0 text-xs font-bold px-2 py-1 rounded-full h-fit mt-1 ${
                r.open_now ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}>
                {r.open_now ? "Open" : "Closed"}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {winner && <WinnerModal restaurant={winner} onClose={() => setWinner(null)} />}
      </AnimatePresence>
    </div>
  );
}