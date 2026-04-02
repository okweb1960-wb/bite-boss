import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Utensils, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import FilterPanel from "../components/FilterPanel";

export default function Home() {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [coords, setCoords] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ radius: 5, cuisines: [], services: [], openNow: true });



  async function detectLocation() {
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ latitude, longitude });
        try {
          const res = await base44.functions.invoke('reverseGeocode', { latitude, longitude });
          setLocation(res.data?.address || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        } catch {
          setLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }
        setDetecting(false);
      },
      () => { setDetecting(false); setError("Couldn't detect location. Type it in!"); },
      { enableHighAccuracy: true }
    );
  }



  async function startSwiping() {
    if (!location.trim()) { setError("Please enter or detect your location first!"); return; }
    setLoading(true);
    setError("");

    let resolvedCoords = coords;
    if (!resolvedCoords) {
      try {
        const geo = await base44.functions.invoke('geocodeAddress', { address: location });
        if (geo.data?.latitude && geo.data?.longitude) {
          resolvedCoords = { latitude: geo.data.latitude, longitude: geo.data.longitude };
          setCoords(resolvedCoords);
        } else {
          setError("Couldn't find that location. Try being more specific (e.g., 'San Jose, CA') or use 📍 Detect.");
          setLoading(false);
          return;
        }
      } catch {
        setError("Couldn't find that location. Try being more specific or use 📍 Detect.");
        setLoading(false);
        return;
      }
    }

    console.log('Sending to findRestaurants:', {
        latitude: resolvedCoords.latitude,
        longitude: resolvedCoords.longitude,
        radius_miles: filters.radius,
        cuisine: filters.cuisines,
        service: filters.services,
        open_now: filters.openNow,
        location_text: location,
      });

    try {
      const response = await base44.functions.invoke('findRestaurants', {
        latitude: resolvedCoords.latitude,
        longitude: resolvedCoords.longitude,
        radius_miles: filters.radius,
        cuisine: filters.cuisines,
        service: filters.services,
        open_now: filters.openNow,
        location_text: location,
      });

      const restaurants = response.data?.restaurants || [];
      if (restaurants.length === 0) {
        setError("No restaurants found. Adjust your filters and try again.");
        setLoading(false);
        return;
      }

      if (response.data?.filterMismatch) {
        toast.info("Showing all nearby results to give you more options.");
      }

      navigate("/swipe", { state: { restaurants, filters, location, coords } });
    } catch (err) {
      setError("Failed to find restaurants. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-b-[2.5rem] shadow-lg" style={{ padding: '20px 24px' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
            <Utensils className="text-white" style={{ width: '20px', height: '20px' }} />
            <span className="text-teal-600 font-bold uppercase tracking-wide" style={{ fontSize: '14px' }}>Cravr</span>
          </div>
          <h1 className="font-playfair font-bold text-white leading-tight" style={{ fontSize: 'clamp(28px, 8vw, 36px)', marginBottom: '4px' }}>
            Where do you<br />want to eat?
          </h1>
          <p className="text-white/70 font-semibold" style={{ fontSize: '13px' }}>"I don't know... where do <em>you</em> want to go?"</p>
        </motion.div>
      </div>
      <div className="flex-1 px-5 py-6 overflow-y-auto space-y-6">
        {/* Location */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="font-bold text-foreground mb-3">Where are you?</h3>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center bg-card border border-teal-600 rounded-2xl px-4 shadow-sm">
              <input
                value={location}
                onChange={e => { setLocation(e.target.value); setCoords(null); }}
                placeholder="City, neighborhood, or address..."
                className="flex-1 py-3 bg-transparent outline-none text-foreground font-semibold placeholder:text-muted-foreground text-sm"
              />
            </div>
            <button
              onClick={detectLocation}
              disabled={detecting}
              className="bg-orange-500 text-white px-4 rounded-2xl font-bold shadow-sm hover:bg-orange-600 transition-all flex items-center gap-1 text-sm"
            >
              {detecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><MapPin className="w-4 h-4" />Detect</>}
            </button>
          </div>
        </motion.div>

        {/* Filters */}
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
           <FilterPanel 
             filters={filters} 
             onChange={setFilters}
           />
         </motion.div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-2xl font-semibold text-sm">{error}</div>
        )}

        {/* CTA Buttons */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-3 pb-8">
          <button
            onClick={startSwiping}
            disabled={loading}
            className="w-full bg-orange-500 text-white font-black text-xl py-5 rounded-3xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="w-6 h-6 animate-spin" /> Finding Restaurants...</>
            ) : (
              <><span>Start Swiping</span><span className="text-2xl">👆</span></>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}