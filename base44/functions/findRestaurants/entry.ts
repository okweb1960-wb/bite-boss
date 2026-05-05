const GMAPS_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

function distanceMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const CUISINE_KEYWORDS = {
  'american':      { words: ['american grill', 'american kitchen', 'american food', 'american cuisine'], types: ['american_restaurant'] },
  'burgers':       { words: ['burger', 'hamburger', 'smash burger'], types: ['hamburger_restaurant', 'fast_food_restaurant'] },
  'mexican':       { words: ['mexican', 'taco', 'burrito', 'tex-mex', 'tamale', 'quesadilla', 'enchilada', 'tortilla', 'taqueria', 'cantina'], types: ['mexican_restaurant'] },
  'italian':       { words: ['italian', 'trattoria', 'pasta', 'osteria'], types: ['italian_restaurant'] },
  'pizza':         { words: ['pizza', 'pizzeria'], types: ['pizza_restaurant'] },
  'chinese':       { words: ['chinese', 'dim sum', 'cantonese', 'szechuan'], types: ['chinese_restaurant'] },
  'japanese':      { words: ['japanese', 'ramen', 'teriyaki', 'hibachi', 'izakaya'], types: ['japanese_restaurant', 'ramen_restaurant'] },
  'sushi':         { words: ['sushi', 'sashimi', 'omakase'], types: ['sushi_restaurant'] },
  'thai':          { words: ['thai'], types: ['thai_restaurant'] },
  'indian':        { words: ['indian', 'curry', 'tandoor'], types: ['indian_restaurant'] },
  'mediterranean': { words: ['mediterranean', 'greek', 'falafel', 'kebab', 'gyro', 'levantine', 'middle eastern'], types: ['mediterranean_restaurant', 'greek_restaurant', 'middle_eastern_restaurant'] },
  'bbq':           { words: ['bbq', 'barbecue', 'barbeque', 'smokehouse'], types: ['barbecue_restaurant'] },
  'seafood':       { words: ['seafood', 'fish', 'crab', 'lobster', 'shrimp', 'oyster'], types: ['seafood_restaurant'] },
  'breakfast':     { words: ['breakfast', 'brunch', 'pancake', 'waffle', 'omelette', 'diner', 'ihop', 'denny'], types: ['breakfast_restaurant', 'brunch_restaurant'] },
  'cafe':          { words: ['cafe', 'coffee', 'espresso', 'coffeehouse'], types: ['cafe', 'coffee_shop'] },
  'desserts':      { words: ['dessert', 'ice cream', 'bakery', 'cake', 'pastry', 'donut', 'yogurt', 'gelato'], types: ['ice_cream_shop', 'bakery', 'dessert_shop'] },
  'fast food':     { words: ['fast food', 'mcdonald', 'burger king', 'wendy', 'taco bell', 'kfc', 'chick-fil-a', 'subway', 'popeyes'], types: ['fast_food_restaurant'] },
};

const CUISINE_SEARCH_MAP = {
  'burgers':       { textQuery: 'burger hamburger restaurant',        includedType: 'hamburger_restaurant' },
  'fast food':     { textQuery: 'fast food restaurant',              includedType: 'fast_food_restaurant' },
  'mexican':       { textQuery: 'mexican restaurant',                includedType: 'mexican_restaurant' },
  'italian':       { textQuery: 'italian restaurant',                includedType: 'italian_restaurant' },
  'pizza':         { textQuery: 'pizza restaurant pizzeria',         includedType: 'pizza_restaurant' },
  'chinese':       { textQuery: 'chinese restaurant',                includedType: 'chinese_restaurant' },
  'japanese':      { textQuery: 'japanese restaurant ramen',         includedType: 'japanese_restaurant' },
  'sushi':         { textQuery: 'sushi restaurant',                  includedType: 'sushi_restaurant' },
  'thai':          { textQuery: 'thai restaurant',                   includedType: 'thai_restaurant' },
  'indian':        { textQuery: 'indian restaurant curry',           includedType: 'indian_restaurant' },
  'mediterranean': { textQuery: 'mediterranean greek restaurant',    includedType: 'mediterranean_restaurant' },
  'bbq':           { textQuery: 'bbq barbecue restaurant',           includedType: 'barbecue_restaurant' },
  'seafood':       { textQuery: 'seafood restaurant fish',           includedType: 'seafood_restaurant' },
  'breakfast':     { textQuery: 'breakfast brunch restaurant',       includedType: 'breakfast_restaurant' },
  'cafe':          { textQuery: 'cafe coffee shop',                  includedType: 'cafe' },
  'desserts':      { textQuery: 'dessert ice cream bakery',          includedType: 'ice_cream_shop' },
  'american':      { textQuery: 'american restaurant grill diner',   includedType: 'american_restaurant' },
};

const PRICE_MAP = { PRICE_LEVEL_FREE: 1, PRICE_LEVEL_INEXPENSIVE: 1, PRICE_LEVEL_MODERATE: 2, PRICE_LEVEL_EXPENSIVE: 3, PRICE_LEVEL_VERY_EXPENSIVE: 4 };

const EXCLUDED_KEYWORDS = /putt|golf|bowling|cinema|theater|theatre|arcade|trampoline|escape room|laser tag|axe throwing|mini golf|go kart|water park|amusement/i;

const FIELD_MASK = [
  'places.displayName', 'places.formattedAddress', 'places.location', 'places.rating',
  'places.userRatingCount', 'places.priceLevel', 'places.currentOpeningHours',
  'places.types', 'places.primaryType', 'places.editorialSummary', 'places.businessStatus', 'places.photos',
  'places.delivery', 'places.takeout', 'places.dineIn', 'places.photos.authorAttributions',
  'places.servesWine', 'places.servesBeer', 'places.servesCocktails',
].join(',');

// FIX 4 — Simplified validator: trust Google's type filtering, just exclude obvious junk
function isValidRestaurant(place) {
  const name = (place.displayName?.text || '').toLowerCase();
  if (EXCLUDED_KEYWORDS.test(name)) return false;
  // Exclude ghost listings with zero social proof
  if ((place.rating || 0) === 0 && (place.userRatingCount || 0) === 0) return false;
  return true;
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { latitude, longitude, radius_miles, cuisine, service, open_now, exclude } = payload;

    const lat = parseFloat(Number(latitude).toFixed(6));
    const lng = parseFloat(Number(longitude).toFixed(6));
    const radiusMeters = Math.round((radius_miles || 5) * 1609.34);
    const cuisineList = Array.isArray(cuisine) ? cuisine : (cuisine ? [cuisine] : []);
    const serviceList = Array.isArray(service) ? service : (service ? [service] : []);
    const excludeNames = (exclude || []).map(n => n.toLowerCase());

    if (isNaN(lat) || isNaN(lng)) {
      return Response.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    // Always search at least 5mi (8047m) from Google, then apply our own distance filter
    const searchRadius = Math.max(radiusMeters, 8047);

    // FIX 1 — searchText uses pageSize (not maxResultCount)
    async function runTextSearch(textQuery, cuisineLabel, includedType) {
      const body = {
        textQuery,
        pageSize: 60, // FIX 2 — maximum allowed, was 20
        rankPreference: 'RELEVANCE',
        strictTypeFiltering: false,
        locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: searchRadius } },
        ...(includedType ? { includedType } : {}),
        ...(open_now ? { openNow: true } : {}),
      };
      console.log(`[textSearch][${cuisineLabel || 'broad'}] query: "${textQuery}" includedType: ${includedType || 'none'}`);
      const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': GMAPS_KEY || '', 'X-Goog-FieldMask': FIELD_MASK },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) console.error(`[textSearch error] ${JSON.stringify(data.error)}`);
      return (data.places || []).map(p => ({ ...p, _sourceCuisine: cuisineLabel }));
    }

    // FIX 3 — searchNearby uses rankPreference: DISTANCE
    async function runNearbySearch(includedTypes, cuisineLabel) {
      const body = {
        includedTypes,
        maxResultCount: 20,
        rankPreference: 'DISTANCE',
        locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: searchRadius } },
        ...(open_now ? { openNow: true } : {}),
      };
      console.log(`[nearbySearch][${cuisineLabel || 'broad'}] types: ${includedTypes.join(',')}`);
      const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': GMAPS_KEY || '', 'X-Goog-FieldMask': FIELD_MASK },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) console.error(`[nearbySearch error] ${JSON.stringify(data.error)}`);
      return (data.places || []).map(p => ({ ...p, _sourceCuisine: cuisineLabel }));
    }

    let queryPromises;

    if (cuisineList.length === 0) {
      // PATH A — No cuisine filter: 3 parallel searchNearby calls for diversity
      queryPromises = [
        runNearbySearch(['restaurant'], null),
        runNearbySearch(['fast_food_restaurant', 'cafe', 'bakery'], null),
        runNearbySearch([
          'hamburger_restaurant', 'pizza_restaurant', 'mexican_restaurant',
          'chinese_restaurant', 'japanese_restaurant', 'thai_restaurant',
          'indian_restaurant', 'mediterranean_restaurant', 'barbecue_restaurant',
          'seafood_restaurant', 'breakfast_restaurant', 'sushi_restaurant', 'ramen_restaurant',
        ], null),
      ];
    } else {
      // PATH B — Cuisine filter: one optimized searchText per cuisine with pageSize: 60
      queryPromises = cuisineList.map(c => {
        const key = c.toLowerCase();
        const mapping = CUISINE_SEARCH_MAP[key];
        const textQuery = mapping?.textQuery || `${key} restaurant`;
        const includedType = mapping?.includedType || null;
        return runTextSearch(textQuery, c, includedType);
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

    function mapPlaceToRestaurant(p) {
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
        const userPhoto = p.photos.find(ph => {
          const attribution = ph.authorAttributions?.[0];
          return attribution && attribution.displayName !== 'Google' && attribution.uri && !attribution.uri.includes('google.com/maps');
        });
        const selectedPhoto = userPhoto || p.photos[Math.min(1, p.photos.length - 1)];
        photoUrl = `https://places.googleapis.com/v1/${selectedPhoto.name}/media?maxWidthPx=800&key=${GMAPS_KEY}`;
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
        dineIn: p.dineIn,
        takeout: p.takeout,
        delivery: p.delivery,
      };
    }

    const validPlaces = uniquePlaces
      .filter(p => p.businessStatus !== 'CLOSED_PERMANENTLY')
      .filter(p => isValidRestaurant(p))
      .filter(p => !excludeNames.includes(p.displayName?.text?.toLowerCase()));

    const mappedRestaurants = validPlaces.map(mapPlaceToRestaurant);

    // FIX 5 — 10% distance buffer to catch boundary restaurants
    const allRestaurants = mappedRestaurants.filter(
      r => r.distance_miles !== null && r.distance_miles <= ((radius_miles || 5) * 1.1)
    );

    const cuisineCounts = {};
    allRestaurants.forEach(r => {
      cuisineCounts[r.cuisine] = (cuisineCounts[r.cuisine] || 0) + 1;
    });

    const availableCuisines = [
      'Restaurant',
      ...Object.keys(cuisineCounts).filter(c => c !== 'Restaurant').sort(),
    ];

    console.log('Total from Google:', uniquePlaces.length);
    console.log('After validation:', validPlaces.length);
    console.log('After distance filter (<= ' + ((radius_miles || 5) * 1.1).toFixed(2) + 'mi):', allRestaurants.length);
    console.log('Cuisine counts:', cuisineCounts);

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

    let filterMismatch = false;
    if (filteredRestaurants.length === 0 && allRestaurants.length > 0) {
      filteredRestaurants = allRestaurants;
      filterMismatch = true;
    }

    filteredRestaurants = filteredRestaurants.sort((a, b) => {
      const ratingDiff = (b.rating || 0) - (a.rating || 0);
      if (Math.abs(ratingDiff) > 0.3) return ratingDiff;
      return (a.distance_miles || 0) - (b.distance_miles || 0);
    });

    return Response.json({
      restaurants: filteredRestaurants,
      filterMismatch,
      availableCuisines,
      debug: {
        totalFromGoogle: uniquePlaces.length,
        afterFiltering: allRestaurants.length,
        cuisineCounts,
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});