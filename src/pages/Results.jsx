import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, Share2 } from "lucide-react";
import WinnerModal from "../components/WinnerModal";
import RestaurantListCard from "../components/RestaurantListCard";
import RestaurantDetailModal from "../components/RestaurantDetailModal";
import SwipeableFomoCard from "../components/SwipeableFomoCard";
import { haptics } from "@/utils/haptics";
import { gtag } from "@/utils/gtag";
import { base44 } from "@/api/base44Client";

export default function Results() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [winner, setWinner] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [detailRestaurant, setDetailRestaurant] = useState(null);
  const [lastWinner, setLastWinner] = useState(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [showUnseen, setShowUnseen] = useState(false);
  const [maybes, setMaybes] = useState(state?.maybes || []);

  if (!state?.maybes) {
    navigate("/", { replace: true });
    return null;
  }
  const allRestaurants = state?.allRestaurants || [];
  const unseenRestaurants = allRestaurants.filter(
    r => !maybes.some(m => m.name === r.name)
  );

  function addToMaybes(restaurant) {
    if (!maybes.some(m => m.name === restaurant.name)) {
      haptics.maybe();
      setMaybes(prev => [...prev, restaurant]);
    }
  }

  async function handleShareMaybes() {
    gtag('event', 'share_tapped', { share_type: 'maybes_list' });
    base44.entities.ShareEvent.create({ share_type: 'maybes_list' });
    const names = maybes.map(r => `• ${r.name}${r.cuisine ? ` (${r.cuisine})` : ''}`).join('\n');
    const message = `I found some great restaurants using Bite Boss! Check out my top picks 👇\n\n${names}\n\nTry it yourself: https://bitebossapp.com`;
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
              <RestaurantListCard key={r.name} restaurant={r} onClick={() => setDetailRestaurant(r)} />
            ))}
          </div>
        )}
      </div>



      {/* Fixed footer */}
      {!showUnseen && (
        <div className="fixed bottom-0 left-0 right-0 z-30 flex flex-col items-center gap-2 pb-5 pt-8 bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
          {maybes.length > 0 && (
            <button
              onClick={handleShareMaybes}
              className="pointer-events-auto w-full max-w-sm flex items-center justify-center gap-3 px-6 py-4 bg-teal-600 text-white font-black text-base rounded-2xl shadow-lg hover:bg-teal-700 transition-all"
            >
              <Share2 className="w-5 h-5" />
              <span>Send This List to a Friend</span>
            </button>
          )}
          {unseenRestaurants.length > 0 && (
            <button
              onClick={() => setShowUnseen(true)}
              className="pointer-events-auto flex items-center gap-2 px-5 py-2 bg-orange-500 text-white font-bold text-sm rounded-full shadow-lg hover:bg-orange-600 transition-all"
            >
              <span>😱</span>
              <span>FOMO Alert — see {unseenRestaurants.length} more places</span>
            </button>
          )}
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
              pointerEvents={showUnseen ? "auto" : "none"}
            />

            {/* Sheet */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center"
              style={{ pointerEvents: 'none' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div
                className="w-full bg-white flex flex-col"
                style={{
                  maxWidth: '480px',
                  width: '100%',
                  height: '85vh',
                  borderRadius: '24px 24px 0 0',
                  margin: '0 auto',
                  pointerEvents: showUnseen ? 'all' : 'none',
                }}
              >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-teal-400" />
              </div>

              {/* Header */}
              <div className="px-5 py-3 border-b border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-bold text-lg text-foreground">Second Look 👀</h2>
                  <button
                    onClick={() => setShowUnseen(false)}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all"
                  >
                    <X className="w-5 h-5 text-foreground" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">You haven't seen these yet — add any that catch your eye</p>
                <button
                  onClick={() => setShowUnseen(false)}
                  className="mt-3 w-full py-3 rounded-2xl font-black text-white text-sm bg-teal-600 hover:bg-teal-700 transition-all"
                >
                  Back to Maybes 💚 ({maybes.length})
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
                  <SwipeableFomoCard
                    key={r.name}
                    restaurant={r}
                    onAddToMaybes={addToMaybes}
                    onViewDetail={() => { setShowUnseen(false); setDetailRestaurant(r); }}
                    isInMaybes={maybes.some(m => m.name === r.name)}
                  />
                ))}
              </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Restaurant Detail Modal */}
      {detailRestaurant && !winner && (
        <RestaurantDetailModal
          restaurant={detailRestaurant}
          onClose={() => setDetailRestaurant(null)}
          onSelect={(r) => { setDetailRestaurant(null); addToMaybes(r); setShowUnseen(false); }}
        />
      )}

      {/* Winner Modal */}
      {(winner || selectedCard) && (
        <WinnerModal
          restaurant={winner || selectedCard}
          maybes={maybes}
          onClose={() => { setWinner(null); setSelectedCard(null); }}
          onPickAgain={() => { setWinner(null); setSelectedCard(null); }}
          isCardTap={!!selectedCard}
        />
      )}
    </div>
  );
}