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
  const [availableCuisines, setAvailableCuisines] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [lastCheckedRadius, setLastCheckedRadius] = useState(5);
  const [lastCheckedOpenNow, setLastCheckedOpenNow] = useState(true);

  async function checkCuisineAvailability(lat, lng, radius, openNow) {
    console.log('Availability check triggered');
    console.log('Radius:', radius);
    setLoadingAvailability(true);
    try {
      const response = await base44.functions.invoke('findRestaurants', {
        latitude: lat,
        longitude: lng,
        radius_miles: radius,
        cuisine: [],
        service: [],
        open_now: openNow,
      });
      console.log('Full API response:', response);
      
      const restaurants = response.data?.restaurants || [];
      console.log('Results count:', restaurants.length);
      
      // Count restaurants by cuisine
      const CUISINE_KEYWORDS = {
        'American': { words: ['american', 'burger', 'diner', 'bbq', 'barbecue', 'steakhouse', 'wings'] },
        'Mexican': { words: ['mexican', 'taco', 'burrito', 'tex-mex', 'tamale', 'quesadilla'] },
        'Italian': { words: ['italian', 'pizza', 'pasta', 'trattoria'] },
        'Pizza': { words: ['pizza', 'pizzeria'] },
        'Chinese': { words: ['chinese', 'dim sum', 'cantonese', 'szechuan'] },
        'Japanese': { words: ['japanese', 'sushi', 'ramen', 'teriyaki', 'hibachi'] },
        'Sushi': { words: ['sushi'] },
        'Thai': { words: ['thai'] },
        'Indian': { words: ['indian', 'curry'] },
        'Mediterranean': { words: ['mediterranean', 'greek', 'falafel', 'kebab', 'gyro'] },
        'Burgers': { words: ['burger', 'hamburger'] },
        'Sandwiches': { words: ['sandwich', 'sub', 'deli', 'hoagie'] },
        'BBQ': { words: ['bbq', 'barbecue'] },
        'Seafood': { words: ['seafood', 'fish'] },
        'Breakfast': { words: ['breakfast', 'brunch', 'pancake', 'waffle'] },
        'Desserts': { words: ['dessert', 'ice cream', 'bakery', 'cake'] },
        'Vegetarian': { words: ['vegetarian'] },
        'Vegan': { words: ['vegan'] },
      };
      
      const cuisineCounts = {};
      restaurants.forEach(r => {
        const cuisine = r.cuisine || 'Restaurant';
        cuisineCounts[cuisine] = (cuisineCounts[cuisine] || 0) + 1;
      });
      console.log('Cuisine counts:', cuisineCounts);
      
      // A cuisine is available if count >= 2
      const available = Object.keys(cuisineCounts).filter(c => cuisineCounts[c] >= 2);
      console.log('Available cuisines:', available);
      
      setAvailableCuisines(available);
      
      // If user's selected cuisine is no longer available, reset to "All"
      const selectedCuisines = filters.cuisines || [];
      const hasUnavailableCuisine = selectedCuisines.some(c => !available.includes(c));
      if (hasUnavailableCuisine && selectedCuisines.length > 0) {
        const unavailable = selectedCuisines.find(c => !available.includes(c));
        setFilters({ ...filters, cuisines: [] });
        toast.info(`No ${unavailable} spots nearby — showing all restaurants instead.`);
      }
    } catch (err) {
      console.error('Failed to check cuisine availability:', err);
    }
    setLoadingAvailability(false);
  }

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
        // Trigger availability check when location is detected
        await checkCuisineAvailability(latitude, longitude, filters.radius, filters.openNow);
        setLastCheckedRadius(filters.radius);
        setLastCheckedOpenNow(filters.openNow);
        setDetecting(false);
      },
      () => { setDetecting(false); setError("Couldn't detect location. Type it in!"); },
      { enableHighAccuracy: true }
    );
  }

  // Trigger availability check when radius or openNow changes
  useEffect(() => {
    if (coords && (filters.radius !== lastCheckedRadius || filters.openNow !== lastCheckedOpenNow)) {
      checkCuisineAvailability(coords.latitude, coords.longitude, filters.radius, filters.openNow);
      setLastCheckedRadius(filters.radius);
      setLastCheckedOpenNow(filters.openNow);
    }
  }, [filters.radius, filters.openNow]);

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
        const suggestion = filters.openNow ? " Try turning off 'Open Right Now' to expand options." : " Try increasing your radius.";
        setError("No restaurants found nearby." + suggestion);
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
      <div className="bg-gradient-to-br from-teal-600 to-teal-700 p-8 pb-12 rounded-b-[2.5rem] shadow-lg">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-2 mb-2">
            <Utensils className="w-7 h-7 text-white" />
            <span className="text-teal-600 font-bold text-lg uppercase tracking-wide">Cravr</span>
          </div>
          <h1 className="font-playfair text-4xl font-bold text-white leading-tight">
            Where do you<br />want to eat?
          </h1>
          <p className="text-white/70 mt-2 font-semibold">"I don't know... where do <em>you</em> want to go?"</p>
        </motion.div>
      </div>
      <div className="flex-1 px-5 py-6 overflow-y-auto space-y-6">
        {/* Location */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="font-bold text-foreground mb-3">Where are you?</h3>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center bg-card border border-teal-600 rounded-2xl px-4 gap-2 shadow-sm">
              <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
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
              {detecting ? <Loader2 className="w-4 h-4 animate-spin" /> : "📍 Detect"}
            </button>
          </div>
        </motion.div>

        {/* Filters */}
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
           <FilterPanel 
             filters={filters} 
             onChange={setFilters}
             availableCuisines={availableCuisines}
             loadingAvailability={loadingAvailability}
             onRadiusChange={(newRadius) => {
               if (coords) {
                 checkCuisineAvailability(coords.latitude, coords.longitude, newRadius, filters.openNow);
               }
             }}
             coords={coords}
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