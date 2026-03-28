import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronUp, Star, MapPin, Clock, ExternalLink, RotateCcw } from "lucide-react";
import WinnerModal from "../components/WinnerModal";
import { haptics } from "@/utils/haptics";

const PRICE_MAP = { 1: "$", 2: "$$", 3: "$$$", 4: "$$$$" };

function RestaurantCard({ restaurant, variant = "default" }) {
  const { name, cuisine, rating, review_count, distance, open_now, price_level, address } = restaurant;
  const priceLevel = price_level ? PRICE_MAP[price_level] : null;
  
  const isMuted = variant === "unseen";
  
  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      isMuted 
        ? "bg-white border-gray-200" 
        : "bg-white border-teal-200 shadow-md"
    }`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-bold text-foreground text-lg flex-1">{name}</h3>
        {priceLevel && <span className="text-xs font-semibold text-gray-500">{priceLevel}</span>}
      </div>
      
      {cuisine && (
        <p className={`text-sm font-semibold mb-2 ${
          isMuted ? "text-gray-500" : "text-teal-600"
        }`}>
          {cuisine}
        </p>
      )}
      
      <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-3">
        {rating && (
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
            <span className="font-semibold">{rating}</span>
            {review_count && <span>({review_count})</span>}
          </span>
        )}
        {distance && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {distance}
          </span>
        )}
        {open_now !== undefined && (
          <span className={`flex items-center gap-1 ${open_now ? "text-green-600" : "text-red-600"}`}>
            <Clock className="w-3 h-3" />
            {open_now ? "Open" : "Closed"}
          </span>
        )}
      </div>
      
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + address)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
      >
        <ExternalLink className="w-3 h-3" />
        View on Maps
      </a>
    </div>
  );
}

export default function Results() {
  const { state } = useLocation();
  const navigate = useNavigate();
  
  if (!state?.maybes) {
    navigate("/", { replace: true });
    return null;
  }
  
  const maybes = state?.maybes || [];
  const allRestaurants = state?.allRestaurants || [];
  const unseen = allRestaurants.filter(r => !maybes.find(m => m.name === r.name));
  
  const [showUnseen, setShowUnseen] = useState(maybes.length === 0);
  const [dragStart, setDragStart] = useState(null);
  const [winner, setWinner] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [lastWinner, setLastWinner] = useState(null);
  const [isShuffling, setIsShuffling] = useState(false);
  
  function handleBottomIndicatorDrag(e) {
    if (!e.touches) return;
    const touchY = e.touches[0].clientY;
    
    if (dragStart === null) {
      setDragStart(touchY);
    } else if (dragStart - touchY > 50) {
      setShowUnseen(true);
      setDragStart(null);
    }
  }
  
  function handleTouchEnd() {
    setDragStart(null);
  }

  function pickWinner() {
    haptics.pickForUs();
    setIsShuffling(true);
    
    setTimeout(() => {
      let selected = maybes[0];
      let attempts = 0;
      while (attempts < 10 && selected.name === lastWinner?.name) {
        const weighted = maybes.map(r => ({
          ...r,
          weight: (r.rating || 3) * Math.random(),
        }));
        selected = weighted.sort((a, b) => b.weight - a.weight)[0];
        attempts++;
      }
      setLastWinner(selected);
      setWinner(selected);
      setIsShuffling(false);
    }, 1000);
  }

  function handlePickAgain() {
    setWinner(null);
    setTimeout(() => pickWinner(), 300);
  }
  
  const showEmptyState = maybes.length === 0;
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* LAYER 1: MAYBES LIST */}
      <AnimatePresence mode="wait">
        {!showUnseen ? (
          <motion.div
            key="maybes-layer"
            className="flex flex-col h-screen bg-background"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Header */}
            <div className="px-5 pt-6 pb-4 flex items-center justify-between border-b border-teal-100">
              <h1 className="font-playfair text-3xl font-bold text-foreground">
                Your Maybes 💚 <span className="text-xl">({maybes.length})</span>
              </h1>
              <button
                onClick={() => navigate("/")}
                className="p-2 rounded-full bg-teal-50 hover:bg-teal-100 transition-all"
                title="Start over"
              >
                <RotateCcw className="w-5 h-5 text-teal-600" />
              </button>
            </div>

            {/* Pick For Us Button */}
            {maybes.length >= 2 && !showEmptyState && (
              <motion.div
                className="px-5 py-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <button
                  onClick={pickWinner}
                  disabled={isShuffling}
                  className="w-full px-6 py-4 bg-orange-500 text-white font-black rounded-2xl shadow-lg hover:shadow-xl transition-all text-lg disabled:opacity-60"
                >
                  🎲 Pick For Me
                </button>
              </motion.div>
            )}
            
            {/* Content */}
            {showEmptyState ? (
              <div className="flex-1 flex flex-col items-center justify-center px-5 text-center">
                <div className="text-7xl mb-4">🤔</div>
                <h2 className="font-bold text-2xl text-foreground mb-2">You were picky today!</h2>
                <p className="text-muted-foreground font-semibold mb-6">Check out the restaurants you missed</p>
                <button
                  onClick={() => setShowUnseen(true)}
                  className="px-6 py-3 bg-teal-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all"
                >
                  See All Restaurants ↑
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 pb-32">
                {maybes.map(r => (
                  <div key={r.name} onClick={() => setSelectedCard(r)} className="cursor-pointer hover:opacity-85 transition-opacity">
                    <RestaurantCard restaurant={r} variant="default" />
                  </div>
                ))}
              </div>
            )}
            
            {/* Bottom Indicator (always visible, even when scrolling) */}
            {!showEmptyState && unseen.length > 0 && (
              <motion.div
                className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-5 py-4 cursor-grab active:cursor-grabbing"
                onTouchStart={handleBottomIndicatorDrag}
                onTouchMove={handleBottomIndicatorDrag}
                onTouchEnd={handleTouchEnd}
                onClick={() => setShowUnseen(true)}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-1 bg-teal-300 rounded-full" />
                  <p className="text-sm font-semibold text-teal-600 flex items-center gap-1">
                    {unseen.length} more restaurants <ChevronUp className="w-4 h-4" />
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
      
      {/* LAYER 2: BOTTOM SHEET (UNSEEN) */}
      <AnimatePresence>
        {showUnseen && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/30 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUnseen(false)}
            />
            
            {/* Bottom Sheet */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 flex flex-col"
              style={{ height: "85vh" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              {/* Handle + Header */}
              <div className="px-5 pt-4 pb-3 border-b border-gray-200">
                <div className="flex justify-center mb-3">
                  <div className="w-10 h-1 bg-teal-300 rounded-full" />
                </div>
                <div className="flex items-center justify-between">
                  <h2 className="font-playfair text-2xl font-bold text-foreground">
                    Restaurants You Haven't Seen <span className="text-lg">({unseen.length})</span>
                  </h2>
                  <button
                    onClick={() => setShowUnseen(false)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-all"
                  >
                    <X className="w-5 h-5 text-foreground" />
                  </button>
                </div>
              </div>
              
              {/* List */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {unseen.map(r => (
                  <RestaurantCard key={r.name} restaurant={r} variant="unseen" />
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Winner Modal */}
      {(winner || selectedCard) && (
        <WinnerModal
          restaurant={winner || selectedCard}
          maybes={maybes}
          onClose={() => { setWinner(null); setSelectedCard(null); }}
          onPickAgain={() => { setSelectedCard(null); setTimeout(() => pickWinner(), 300); }}
          isCardTap={!!selectedCard}
        />
      )}
    </div>
  );
}