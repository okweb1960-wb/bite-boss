import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw } from "lucide-react";
import WinnerModal from "../components/WinnerModal";
import RestaurantCard from "../components/RestaurantCard";
import { haptics } from "@/utils/haptics";

export default function Results() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [winner, setWinner] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [lastWinner, setLastWinner] = useState(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [showUnseen, setShowUnseen] = useState(false);

  if (!state?.maybes) {
    navigate("/", { replace: true });
    return null;
  }

  const maybes = state?.maybes || [];
  const allRestaurants = state?.allRestaurants || [];
  const unseenRestaurants = allRestaurants.filter(
    r => !maybes.some(m => m.name === r.name)
  );

  async function handleShareMaybes() {
    const names = maybes.map(r => `• ${r.name}${r.cuisine ? ` (${r.cuisine})` : ''}`).join('\n');
    const message = `Deciding with someone? Here's my shortlist 👇\n\n${names}\n\nFind your perfect restaurant: ${window.location.origin}`;
    if (navigator.share) {
      await navigator.share({ text: message });
    } else {
      await navigator.clipboard.writeText(message);
      alert('Copied to clipboard!');
    }
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
      {/* MAYBES LIST */}
      <div className="flex flex-col h-screen bg-background">
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

        {/* Pick For Me Button */}
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
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 pb-36">
            {maybes.map(r => (
              <div key={r.name} onClick={() => setSelectedCard(r)} className="cursor-pointer hover:opacity-85 transition-opacity">
                <RestaurantCard restaurant={r} onSwipe={() => {}} isTop={false} />
              </div>
            ))}
            {/* Share Maybes */}
            {maybes.length > 0 && (
              <div className="mt-4 py-4 flex flex-col items-center gap-2 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-500 text-center">Deciding with someone? Send them this list 👇</p>
                <button
                  onClick={handleShareMaybes}
                  className="px-6 py-3 bg-teal-600 text-white font-black rounded-2xl shadow hover:shadow-md transition-all text-sm"
                >
                  Share My Maybes 📲
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pull Indicator — only when unseen sheet is closed and there are unseen restaurants */}
      {!showUnseen && unseenRestaurants.length > 0 && (
        <button
          onClick={() => setShowUnseen(true)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 px-5 py-3 rounded-full font-bold text-white text-sm shadow-lg flex items-center gap-2 whitespace-nowrap"
          style={{ background: '#0D9488', boxShadow: '0 4px 20px rgba(13,148,136,0.4)' }}
        >
          ↑ {unseenRestaurants.length} more restaurants
        </button>
      )}

      {/* Unseen Bottom Sheet */}
      <AnimatePresence>
        {showUnseen && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.3)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUnseen(false)}
            />

            {/* Sheet */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 bg-white flex flex-col"
              style={{ height: '85vh', borderRadius: '24px 24px 0 0' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-teal-400" />
              </div>

              {/* Header */}
              <div className="px-5 py-3 flex items-center justify-between border-b border-gray-100">
                <div>
                  <h2 className="font-bold text-lg text-foreground">Restaurants You Haven't Seen</h2>
                  <p className="text-sm text-muted-foreground">{unseenRestaurants.length} places</p>
                </div>
                <button
                  onClick={() => setShowUnseen(false)}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all"
                >
                  <X className="w-5 h-5 text-foreground" />
                </button>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {unseenRestaurants.map(r => (
                  <div
                    key={r.name}
                    onClick={() => { setShowUnseen(false); setSelectedCard(r); }}
                    className="cursor-pointer hover:opacity-85 transition-opacity"
                  >
                    <RestaurantCard restaurant={r} onSwipe={() => {}} isTop={false} />
                  </div>
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