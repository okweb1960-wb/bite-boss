import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const GMAPS_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

function distanceMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// For each cuisine, define the textQuery to send AND the includedTypes (soft filter, plural)
// 'restaurant' is always included as a safety net
const CUISINE_SEARCH = {
  'american':      { textQuery: 'american restaurant',       includedTypes: ['american_restaurant', 'restaurant'] },
  'burgers':       { textQuery: 'burger hamburger',          includedTypes: ['hamburger_restaurant', 'fast_food_restaurant', 'restaurant'] },
  'mexican':       { textQuery: 'mexican restaurant',        includedTypes: ['mexican_restaurant', 'restaurant'] },
  'italian':       { textQuery: 'italian restaurant pasta',  includedTypes: ['italian_restaurant', 'restaurant'] },
  'pizza':         { textQuery: 'pizza',                     includedTypes: ['pizza_restaurant', 'restaurant'] },
  'chinese':       { textQuery: 'chinese restaurant',        includedTypes: ['chinese_restaurant', 'restaurant'] },
  'japanese':      { textQuery: 'japanese restaurant ramen', includedTypes: ['japanese_restaurant', 'ramen_restaurant', 'restaurant'] },
  'sushi':         { textQuery: 'sushi',                     includedTypes: ['sushi_restaurant', 'japanese_restaurant', 'restaurant'] },
  'thai':          { textQuery: 'thai restaurant',           includedTypes: ['thai_restaurant', 'restaurant'] },
  'indian':        { textQuery: 'indian restaurant curry',   includedTypes: ['indian_restaurant', 'restaurant'] },
  'mediterranean': { textQuery: 'mediterranean restaurant',  includedTypes: ['mediterranean_restaurant', 'greek_restaurant', 'middle_eastern_restaurant', 'restaurant'] },
  'bbq':           { textQuery: 'bbq barbecue smokehouse',   includedTypes: ['barbecue_restaurant', 'restaurant'] },
  'seafood':       { textQuery: 'seafood restaurant',        includedTypes: ['seafood_restaurant', 'restaurant'] },
  'breakfast':     { textQuery: 'breakfast brunch',          includedTypes: ['breakfast_restaurant', 'brunch_restaurant', 'restaurant'] },
  'cafe':          { textQuery: 'cafe coffee shop',          includedTypes: ['cafe', 'coffee_shop', 'restaurant'] },
  'desserts':      { textQuery: 'dessert ice cream bakery',  includedTypes: ['ice_cream_shop', 'bakery', 'dessert_shop', 'restaurant'] },
  'fast food':     { textQuery: 'fast food',                 includedTypes: ['fast_food_restaurant', 'restaurant'] },
};

const CUISINE_KEYWORDS = {
  'american':      { words: ['american grill', 'american kitchen', 'american food'], types: ['american_restaurant'] },
  'burgers':       { words: ['burger', 'hamburger', 'smash burger'], types: ['hamburger_restaurant', 'fast_food_restaurant'] },
  'mexican':       { words: ['mexican', 'taco', 'burrito', 'tex-mex', 'taqueria', 'cantina'], types: ['mexican_restaurant'] },
  'italian':       { words: ['italian', 'trattoria', 'pasta', 'osteria'], types: ['italian_restaurant'] },
  'pizza':         { words: ['pizza', 'pizzeria'], types: ['pizza_restaurant'] },
  'chinese':       { words: ['chinese', 'dim sum', 'cantonese', 'szechuan'], types: ['chinese_restaurant'] },
  'japanese':      { words: ['japanese', 'ramen', 'teriyaki', 'hibachi', 'izakaya'], types: ['japanese_restaurant', 'ramen_restaurant'] },
  'sushi':         { words: ['sushi', 'sashimi', 'omakase'], types: ['sushi_restaurant'] },
  'thai':          { words: ['thai'], types: ['thai_restaurant'] },
  'indian':        { words: ['indian', 'curry', 'tandoor'], types: ['indian_restaurant'] },
  'mediterranean': { words: ['mediterranean', 'greek', 'falafel', 'kebab', 'gyro', 'middle eastern'], types: ['mediterranean_restaurant', 'greek_restaurant', 'middle_eastern_restaurant'] },
  'bbq':           { words: ['bbq', 'barbecue', 'barbeque', 'smokehouse'], types: ['barbecue_restaurant'] },
  'seafood':       { words: ['seafood', 'fish', 'crab', 'lobster', 'shrimp', 'oyster'], types: ['seafood_restaurant'] },
  'breakfast':     { words: ['breakfast', 'brunch', 'pancake', 'waffle', 'diner'], types: ['breakfast_restaurant', 'brunch_restaurant'] },
  'cafe':          { words: ['cafe', 'coffee', 'espresso', 'coffeehouse'], types: ['cafe', 'coffee_shop'] },
  'desserts':      { words: ['dessert', 'ice cream', 'bakery', 'cake', 'pastry', 'donut', 'gelato'], types: ['ice_cream_shop', 'bakery', 'dessert_shop'] },
  'fast food':     { words: ['fast food', 'mcdonald', 'burger king', 'wendy', 'taco bell', 'kfc', 'subway', 'sonic', 'popeyes', 'dairy queen'], types: ['fast_food_restaurant'] },
};

const PRICE_MAP = { PRICE_LEVEL_FREE: 1, PRICE_LEVEL_INEXPENSIVE: 1, PRICE_LEVEL_MODERATE: 2, PRICE_LEVEL_EXPENSIVE: 3, PRICE_LEVEL_VERY_EXPENSIVE: 4 };

const VALID_FOOD_TYPES = new Set([
  'restaurant', 'food', 'fast_food_restaurant', 'cafe', 'bakery', 'meal_takeaway', 'meal_delivery',
  'sandwich_shop', 'pizza_restaurant', 'hamburger_restaurant', 'mexican_restaurant',
  'chinese_restaurant', 'japanese_restaurant', 'thai_restaurant', 'indian_restaurant',
  'italian_restaurant', 'seafood_restaurant', 'steak_house', 'sushi_restaurant',
  'ramen_restaurant', 'barbecue_restaurant', 'breakfast_restaurant', 'brunch_restaurant',
  'ice_cream_shop', 'dessert_shop', 'vegan_restaurant', 'vegetarian_restaurant',
  'mediterranean_restaurant', 'greek_restaurant', 'american_restaurant', 'middle_eastern_restaurant',
  'coffee_shop'
]);

const INVALID_TYPES = new Set([
  'miniature_golf', 'amusement_center', 'bowling_alley', 'movie_theater', 'night_club',
  'stadium', 'sports_club', 'gym', 'shopping_mall', 'grocery_store',
  'convenience_store', 'gas_station', 'hotel', 'lodging'
]);

const EXCLUDED_KEYWORDS = /putt|bowling|cinema|theater|theatre|arcade|trampoline|escape room|laser tag|axe throwing|mini golf|go kart|water park|amusement/i;

const FIELD_MASK = [
  'places.displayName', 'places.formattedAddress', 'places.location', 'places.rating',
  'places.userRatingCount', 'places.priceLevel', 'places.currentOpeningHours',
  'places.types', 'places.primaryType', 'places.editorialSummary', 'places.businessStatus', 'places.photos',
  'places.delivery', 'places.takeout', 'places.dineIn',
  'places.servesWine', 'places.servesBeer', 'places.servesCocktails',
].join(',');

function isValidRestaurant(place) {
  const types = place.types || [];
  const name = (place.displayName?.text || '').toLowerCase();
  if (EXCLUDED_KEYWORDS.test(name)) return false;
  const hasFoodType = types.some(t => VALID_FOOD_TYPES.has(t));
  if (!hasFoodType) return false;
  const hasInvalidType = types.some(t => INVALID_TYPES.has(t));
  const hasValidType = types.some(t => VALID_FOOD_TYPES.has(t));
  if (hasInvalidType && !hasValidType) return false;
  if ((place.rating || 0) === 0 && (place.userRatingCount || 0) === 0) return false;
  return true;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const { latitude, longitude, radius_miles, cuisine, service, open_now, exclude } = payload;

    const lat = parseFloat(Number(latitude).toFixed(6));
    const lng = parseFloat(Number(longitude).toFixed(6));
    const radiusMeters = Math.max(Math.round((radius_miles || 5) * 1609.34), 8046);
    const cuisineList = Array.isArray(cuisine) ? cuisine : (cuisine ? [cuisine] : []);
    const serviceList = Array.isArray(service) ? service : (service ? [service] : []);
    const excludeNames = (exclude || []).map(n => n.toLowerCase());

    if (isNaN(lat) || isNaN(lng)) {
      return Response.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    // Universal search: always use searchText with textQuery + includedTypes (soft filter)
    async function runSearch(textQuery, includedTypes, cuisineLabel) {
      const body = {
        textQuery,
        maxResultCount: 20,
        includedType: 'restaurant', // singular = soft filter safety net
        locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: radiusMeters } },
        ...(open_now ? { openNow: true } : {}),
      };
      const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': GMAPS_KEY || '', 'X-Goog-FieldMask': FIELD_MASK },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      return (data.places || []).map(p => ({ ...p, _sourceCuisine: cuisineLabel }));
    }

    let queryPromises;
    if (cuisineList.length === 0) {
      // Broad search with no cuisine filter
      queryPromises = [runSearch('restaurant', ['restaurant'], null)];
    } else {
      queryPromises = cuisineList.map(c => {
        const key = c.toLowerCase();
        const config = CUISINE_SEARCH[key] || { textQuery: `${key} restaurant`, includedTypes: ['restaurant'] };
        return runSearch(config.textQuery, config.includedTypes, c);
      });
    }

    const allResults = await Promise.all(queryPromises);

    // Deduplicate by name + address
    const seen = new Set();
    const uniquePlaces = allResults.flat().filter(p => {
      const key = `${p.displayName?.text}|${p.formattedAddress}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Filter valid restaurants
    const validPlaces = uniquePlaces
      .filter(p => p.businessStatus !== 'CLOSED_PERMANENTLY')
      .filter(p => isValidRestaurant(p))
      .filter(p => !excludeNames.includes((p.displayName?.text || '').toLowerCase()));

    // Map to restaurant objects
    function mapPlace(p) {
      const pLat = p.location?.latitude;
      const pLng = p.location?.longitude;
      const d = (pLat && pLng) ? distanceMiles(lat, lng, pLat, pLng) : null;

      const nameLower = (p.displayName?.text || '').toLowerCase();
      const descLower = (p.editorialSummary?.text || '').toLowerCase();
      const typesArr = p.types || [];

      let cuisineLabel = p._sourceCuisine
        ? p._sourceCuisine.charAt(0).toUpperCase() + p._sourceCuisine.slice(1)
        : 'Restaurant';

      if (cuisineLabel === 'Restaurant') {
        for (const [key, val] of Object.entries(CUISINE_KEYWORDS)) {
          if (typesArr.some(t => val.types.includes(t))) {
            cuisineLabel = key.charAt(0).toUpperCase() + key.slice(1);
            break;
          }
        }
      }

      if (cuisineLabel === 'Restaurant') {
        const haystack = nameLower + ' ' + descLower;
        for (const [key, val] of Object.entries(CUISINE_KEYWORDS)) {
          if (val.words.some(w => haystack.includes(w))) {
            cuisineLabel = key.charAt(0).toUpperCase() + key.slice(1);
            break;
          }
        }
      }

      let photoUrl = null;
      if (p.photos && p.photos.length > 0) {
        photoUrl = `https://places.googleapis.com/v1/${p.photos[0].name}/media?maxWidthPx=800&key=${GMAPS_KEY}`;
      }

      return {
        name: p.displayName?.text || 'Unknown Restaurant',
        cuisine: cuisineLabel,
        address: p.formattedAddress || '',
        rating: p.rating || 0,
        review_count: p.userRatingCount || 0,
        price_level: PRICE_MAP[p.priceLevel] || null,
        open_now: p.currentOpeningHours?.openNow,
        description: p.editorialSummary?.text || '',
        distance_miles: d,
        distance: d === null ? '' : d < 0.1 ? `${Math.round(d * 5280)} ft` : `${d.toFixed(1)} mi`,
        photo_url: photoUrl,
        dine_in: p.dineIn,
        takeout: p.takeout,
        delivery: p.delivery,
      };
    }

    // Distance filter
    const allRestaurants = validPlaces
      .map(mapPlace)
      .filter(r => r.distance_miles !== null && r.distance_miles <= (radius_miles || 5));

    // Service filter
    let filteredRestaurants = allRestaurants;
    if (serviceList.length > 0) {
      filteredRestaurants = filteredRestaurants.filter(r =>
        serviceList.some(s => {
          if (s === 'dine_in') return r.dine_in === true;
          if (s === 'takeout') return r.takeout === true;
          if (s === 'delivery') return r.delivery === true;
          return true;
        })
      );
    }

    // Fallback if filters yield 0
    let filterMismatch = false;
    if (filteredRestaurants.length === 0 && allRestaurants.length > 0) {
      filteredRestaurants = allRestaurants;
      filterMismatch = true;
    }

    // Sort by rating then distance
    filteredRestaurants = filteredRestaurants.sort((a, b) => {
      const ratingDiff = (b.rating || 0) - (a.rating || 0);
      if (Math.abs(ratingDiff) > 0.3) return ratingDiff;
      return (a.distance_miles || 0) - (b.distance_miles || 0);
    });

    const cuisineCounts = {};
    filteredRestaurants.forEach(r => { cuisineCounts[r.cuisine] = (cuisineCounts[r.cuisine] || 0) + 1; });
    const availableCuisines = ['Restaurant', ...Object.keys(cuisineCounts).filter(c => c !== 'Restaurant')].sort();

    console.log('Unique places fetched:', uniquePlaces.length);
    console.log('After valid filter:', validPlaces.length);
    console.log('After distance filter:', allRestaurants.length);
    console.log('Final count:', filteredRestaurants.length);

    return Response.json({
      restaurants: filteredRestaurants,
      filterMismatch,
      availableCuisines,
      debug: { totalFromGoogle: uniquePlaces.length, afterFiltering: allRestaurants.length, cuisineCounts }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});