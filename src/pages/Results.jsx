import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw } from "lucide-react";
import WinnerModal from "../components/WinnerModal";
import RestaurantListCard from "../components/RestaurantListCard";
import { haptics } from "@/utils/haptics";
import { gtag } from "@/utils/gtag";

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
    gtag('event', 'share_tapped', { share_type: 'maybes_list' });
    const names = maybes.map(r => `• ${r.name}${r.cuisine ? ` (${r.cuisine})` : ''}`).join('\n');
    const message = `Deciding with someone? Here's my shortlist 👇\n\n${names}\n\nFind your perfect restaurant: ${window.location.origin}`;
    try {
      if (navigator.share) {
        await navigator.share({ text: message });
        return;
      }
    } catch (e) {
      // Share failed or was cancelled, fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(message);
      alert('Copied to clipboard!');
    } catch (e) {
      alert(message);
    }
  }

  function pickWinner() {
    haptics.pickForUs();
    gtag('event', 'pick_for_me_used', { maybe_count: maybes.length });
    setIsShuffling(true);
    setTimeout(() => {
      const weighted = maybes.map(r => ({
        ...r,
        weight: (r.rating || 3) * Math.random(),
      }));
      let selected = weighted.sort((a, b) => b.weight - a.weight)[0];
      if (selected.name === lastWinner?.name && maybes.length > 1) {
        const others = weighted.filter(r => r.name !== lastWinner.name);
        selected = others.sort((a, b) => b.weight - a.weight)[0];
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
              <RestaurantListCard key={r.name} restaurant={r} onClick={() => setSelectedCard(r)} />
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



      {/* Pull indicator for unseen sheet */}
      {!showUnseen && unseenRestaurants.length > 0 && maybes.length > 0 && (
        <div
          onClick={() => setShowUnseen(true)}
          className="fixed bottom-0 left-0 right-0 flex justify-center pb-4 pt-2 bg-gradient-to-t from-white to-transparent cursor-pointer z-30"
        >
          <div className="flex items-center gap-2 px-5 py-2 bg-teal-600 text-white font-bold text-sm rounded-full shadow-lg">
            <span>↑</span>
            <span>{unseenRestaurants.length} more restaurants</span>
          </div>
        </div>
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
                {unseenRestaurants.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="text-5xl mb-4">🎯</div>
                    <p className="font-bold text-lg text-foreground mb-2">You saw them all!</p>
                    <p className="text-muted-foreground text-sm">Every restaurant made it into your Maybes or Nopes.</p>
                  </div>
                ) : unseenRestaurants.map(r => (
                  <RestaurantListCard
                    key={r.name}
                    restaurant={r}
                    onClick={() => { setShowUnseen(false); setSelectedCard(r); }}
                  />
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