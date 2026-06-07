import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { MapPin, Loader2, CornerDownLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import FilterPanel from "../components/FilterPanel";
import { gtag } from "@/utils/gtag";

export default function Home() {
  const navigate = useNavigate();
  const { state: routeState } = useLocation();
  const savedLocation = (() => { try { return JSON.parse(localStorage.getItem('biteboss_last_location')); } catch { return null; } })();
  const [location, setLocation] = useState(savedLocation?.locationText || "");
  const [coords, setCoords] = useState(savedLocation?.coords || null);
  const [detecting, setDetecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(routeState?.prefillFilters || { radius: 5, cuisines: [], services: [], openNow: true });
  const [confirmed, setConfirmed] = useState(!!(savedLocation?.coords));
  const [resolvedAddress, setResolvedAddress] = useState(savedLocation?.locationText || "");
  const [confirming, setConfirming] = useState(false);



  async function confirmLocation() {
    if (!location.trim()) { setError("Please enter a location first!"); return; }
    setConfirming(true);
    setError("");
    try {
      const geo = await base44.functions.invoke('geocodeAddress', { address: location });
      if (geo.data?.latitude && geo.data?.longitude) {
        setCoords({ latitude: geo.data.latitude, longitude: geo.data.longitude });
        const addr = geo.data.formatted_address || geo.data.address || location;
        setResolvedAddress(addr);
        setConfirmed(true);
      } else {
        setError("Couldn't find that location. Try being more specific (e.g., 'Omaha, NE') or use the detect button.");
      }
    } catch {
      setError("Couldn't find that location. Try being more specific (e.g., 'Omaha, NE') or use the detect button.");
    }
    setConfirming(false);
  }

  async function detectLocation() {
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ latitude, longitude });
        try {
          const res = await base44.functions.invoke('reverseGeocode', { latitude, longitude });
          const addr = res.data?.address || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          setLocation(addr);
          setResolvedAddress(addr);
          setConfirmed(true);
        } catch {
          const fallback = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          setLocation(fallback);
          setResolvedAddress(fallback);
          setConfirmed(true);
        }
        setDetecting(false);
      },
      () => { setDetecting(false); setError("Couldn't detect location. Type it in!"); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }



  async function startSwiping() {
    if (!location.trim() || !coords) { setError("Please confirm your location first!"); return; }
    setLoading(true);
    setError("");

    const resolvedCoords = coords;

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

      gtag('event', 'search_started', {
        radius_miles: filters.radius,
        cuisine_count: filters.cuisines.length,
        service_count: filters.services.length,
        open_now: filters.openNow
      });

      // Save session record
      let sessionId = null;
      try {
        const session = await base44.entities.Session.create({
          location_text: location,
          latitude: resolvedCoords.latitude,
          longitude: resolvedCoords.longitude,
          radius_miles: filters.radius,
          cuisine_filter: filters.cuisines.join(','),
          service_filter: filters.services.join(','),
          open_now_filter: filters.openNow,
          restaurants: JSON.stringify(restaurants.map(r => r.name)),
          status: 'swiping',
        });
        sessionId = session.id;
      } catch (e) { /* non-critical */ }

      localStorage.setItem('biteboss_last_location', JSON.stringify({ locationText: location, coords: resolvedCoords }));
      navigate("/swipe", { state: { restaurants, filters, location, coords: resolvedCoords, sessionId } });
    } catch (err) {
      setError("Failed to find restaurants. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="rounded-b-[2.5rem] shadow-lg overflow-hidden bg-teal-600" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <img
            src="https://media.base44.com/images/public/69c6057518b3fad7a690ceef/8c2b5da37_image_b15af7e4.png"
            alt="Bite Boss header"
            className="w-full"
            style={{ display: 'block' }}
          />
        </motion.div>
      </div>
      <div className="flex-1 px-5 py-6 overflow-y-auto space-y-6">
        {/* Location */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="font-bold text-foreground mb-3">Select a location</h3>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center bg-card border border-teal-600 rounded-2xl px-4 shadow-sm overflow-hidden">
              <input
                value={location}
                onChange={e => { setLocation(e.target.value); setCoords(null); setConfirmed(false); setResolvedAddress(""); }}
                onKeyDown={e => { if (e.key === 'Enter' && !confirmed) confirmLocation(); }}
                placeholder="City, neighborhood, or address..."
                className="flex-1 py-3 bg-transparent outline-none text-foreground font-semibold placeholder:text-muted-foreground text-sm"
              />
              <button
                onClick={() => { if (!confirmed) confirmLocation(); }}
                disabled={confirming}
                className="pl-3 border-l border-teal-200 flex items-center justify-center h-full py-3 ml-1"
              >
                {confirming
                  ? <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                  : confirmed
                    ? <Check className="w-5 h-5 text-green-500" />
                    : <CornerDownLeft className="w-5 h-5 text-teal-600" />
                }
              </button>
            </div>
            <button
              onClick={detectLocation}
              disabled={detecting}
              className="bg-orange-500 text-white px-4 rounded-2xl font-bold shadow-sm hover:bg-orange-600 transition-all flex items-center justify-center"
            >
              {detecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
            </button>
          </div>
          {resolvedAddress && (
            <p className="text-teal-600 text-xs mt-1.5 pl-1">✓ {resolvedAddress}</p>
          )}
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
            disabled={loading || !confirmed}
            className="w-full bg-orange-500 text-white font-black text-xl py-5 rounded-3xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="w-6 h-6 animate-spin" /> Finding Restaurants...</>
            ) : (
              <><span>Start Swiping</span><span className="text-2xl">👆</span></>
            )}
          </button>
          {!confirmed && (
            <p className="text-muted-foreground text-xs text-center">Confirm your location above to start swiping</p>
          )}
        </motion.div>

        {/* Footer */}
        <div style={{ paddingTop: '8px', paddingBottom: '16px', textAlign: 'center', fontSize: '11px', color: '#9CA3AF' }}>
          © 2026 Bite Boss App ·{' '}
          <Link to="/terms" style={{ color: '#9CA3AF', textDecoration: 'none' }} className="hover:underline">Terms of Service</Link>
          {' | '}
          <Link to="/privacy" style={{ color: '#9CA3AF', textDecoration: 'none' }} className="hover:underline">Privacy Policy</Link>
          {' | '}
          <a href="mailto:support@bitebossapp.com" style={{ color: '#9CA3AF', textDecoration: 'none' }} className="hover:underline">Contact</a>
        </div>
      </div>
    </div>
  );
}