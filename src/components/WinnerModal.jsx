import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, MapPin, ExternalLink } from "lucide-react";
import { haptics } from "@/utils/haptics";

const PRICE_MAP = { 1: "$", 2: "$$", 3: "$$$", 4: "$$$$" };

function Confetti() {
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "9999";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    const particles = [];
    const colors = ["#0D9488", "#F97316", "#CCFBF1", "#FFFFFF"];

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: canvas.width / 2,
        y: -20,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 6 + 2,
        life: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 4 + 2,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.life -= 0.01;

        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        if (p.life <= 0) particles.splice(i, 1);
      }

      if (particles.length > 0) requestAnimationFrame(animate);
      else document.body.removeChild(canvas);
    };

    animate();
  }, []);

  return null;
}

export default function WinnerModal({ restaurant, maybes, onClose, onPickAgain }) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
    haptics.winnerLands();
  }, []);

  const { name = "Unknown", cuisine, rating, review_count, distance, price_level, description, photo_url, address } = restaurant;
  const priceLevel = price_level ? PRICE_MAP[price_level] || PRICE_MAP[price_level.toString()] : null;

  function handlePickAgain() {
    haptics.pickForUs();
    onPickAgain();
  }

  function handleLetsGo() {
    haptics.letsGo();
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " " + address)}`,
      "_blank"
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {showConfetti && <Confetti />}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all z-40"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* Content */}
        <motion.div
          className="flex flex-col items-center gap-6 max-w-md w-full"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", damping: 20 }}
        >
          {/* Heading */}
          <h1 className="text-center font-bold text-white" style={{ fontSize: "28px" }}>
            TONIGHT YOU'RE GOING TO...
          </h1>

          {/* Restaurant Card */}
          <div className="w-full bg-white rounded-3xl overflow-hidden shadow-2xl">
            {/* Photo */}
            {photo_url && (
              <div className="relative w-full h-48 overflow-hidden">
                <img
                  src={photo_url}
                  alt={name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)" }} />
              </div>
            )}

            {/* Card content */}
            <div className="p-5">
              <h2 className="font-black text-3xl text-foreground mb-2" style={{ lineHeight: 1.2 }}>
                {name}
              </h2>

              {priceLevel && (
                <p className="font-bold text-teal-600 text-sm mb-2">{priceLevel}</p>
              )}

              {cuisine && <p className="font-semibold text-orange-500 mb-2">{cuisine}</p>}

              <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
                {rating && (
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4" style={{ fill: "#f59e0b", color: "#f59e0b" }} />
                    <span className="font-semibold text-foreground">{rating}</span>
                    {review_count && <span>({review_count})</span>}
                  </span>
                )}
                {distance && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {distance}
                  </span>
                )}
              </div>

              {description && (
                <p className="text-sm text-gray-600 mb-4 italic">{description}</p>
              )}

              {/* Service tags */}
              {(restaurant.takeout || restaurant.delivery || restaurant.dineIn) && (
                <div className="flex gap-2 mb-4 flex-wrap">
                  {restaurant.takeout && (
                    <span style={{ background: "#F3F4F6", color: "#6B7280", fontSize: "11px", padding: "4px 8px", borderRadius: "12px", fontWeight: 500 }}>
                      🥡 Takeout
                    </span>
                  )}
                  {restaurant.delivery && (
                    <span style={{ background: "#F3F4F6", color: "#6B7280", fontSize: "11px", padding: "4px 8px", borderRadius: "12px", fontWeight: 500 }}>
                      🚗 Delivery
                    </span>
                  )}
                  {restaurant.dineIn && (
                    <span style={{ background: "#F3F4F6", color: "#6B7280", fontSize: "11px", padding: "4px 8px", borderRadius: "12px", fontWeight: 500 }}>
                      🍽️ Dine-in
                    </span>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 mt-5">
                <button
                  onClick={handleLetsGo}
                  className="flex-1 px-5 py-3 bg-teal-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all text-sm"
                >
                  Let's Go! 🎉
                </button>
                <button
                  onClick={handlePickAgain}
                  className="flex-1 px-5 py-3 border-2 border-teal-600 text-teal-600 font-bold rounded-2xl hover:bg-teal-50 transition-all text-sm"
                >
                  Pick Again 🎲
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}