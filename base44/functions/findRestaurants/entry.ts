import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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
  'burgers':       { words: ['burger', 'hamburger', 'smash burger', 'fast food', 'wendy', 'mcdonald', 'whataburger', 'five guys', 'shake shack', 'culver', 'in-n-out', 'sonic'], types: ['hamburger_restaurant', 'fast_food_restaurant'] },
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
  'fast food':     { words: ['mcdonald', 'burger king', 'wendy', 'taco bell', 'kfc', 'chick-fil-a', 'subway', 'fast food', 'whataburger', 'sonic', 'popeyes', 'dairy queen', 'jack in the box', 'five guys', 'in-n-out', 'culver', 'shake shack'], types: ['fast_food_restaurant'] },
};

// Cuisines with a direct Google Primary Type — use includedPrimaryTypes for precision
// Cuisines without a primary type — use textQuery so Google searches menu/reviews
const CUISINE_SEARCH_QUERIES = {
  'american':      { textQuery: 'american restaurant', includedPrimaryTypes: ['american_restaurant'] },
  'burgers':       { textQuery: 'burgers' },
  'fast food':     { textQuery: 'fast food', includedPrimaryTypes: ['fast_food_restaurant'] },
  'mexican':       { textQuery: 'mexican restaurant', includedPrimaryTypes: ['mexican_restaurant'] },
  'italian':       { textQuery: 'italian restaurant', includedPrimaryTypes: ['italian_restaurant'] },
  'pizza':         { textQuery: 'pizza' },
  'chinese':       { textQuery: 'chinese restaurant', includedPrimaryTypes: ['chinese_restaurant'] },
  'japanese':      { textQuery: 'japanese restaurant', includedPrimaryTypes: ['japanese_restaurant'] },
  'sushi':         { textQuery: 'sushi' },
  'thai':          { textQuery: 'thai restaurant', includedPrimaryTypes: ['thai_restaurant'] },
  'indian':        { textQuery: 'indian restaurant', includedPrimaryTypes: ['indian_restaurant'] },
  'mediterranean': { textQuery: 'mediterranean restaurant' },
  'bbq':           { textQuery: 'bbq barbecue' },
  'seafood':       { textQuery: 'seafood restaurant' },
  'breakfast':     { textQuery: 'breakfast brunch' },
  'cafe':          { textQuery: 'cafe coffee', includedPrimaryTypes: ['cafe'] },
  'desserts':      { textQuery: 'dessert ice cream' },
};

const PRICE_MAP = { PRICE_LEVEL_FREE: 1, PRICE_LEVEL_INEXPENSIVE: 1, PRICE_LEVEL_MODERATE: 2, PRICE_LEVEL_EXPENSIVE: 3, PRICE_LEVEL_VERY_EXPENSIVE: 4 };

const VALID_FOOD_TYPES = new Set([
  'restaurant', 'fast_food_restaurant', 'cafe', 'bakery', 'meal_takeaway', 'meal_delivery',
  'sandwich_shop', 'pizza_restaurant', 'hamburger_restaurant', 'mexican_restaurant',
  'chinese_restaurant', 'japanese_restaurant', 'thai_restaurant', 'indian_restaurant',
  'italian_restaurant', 'seafood_restaurant', 'steak_house', 'sushi_restaurant',
  'ramen_restaurant', 'barbecue_restaurant', 'breakfast_restaurant', 'brunch_restaurant',
  'ice_cream_shop', 'dessert_shop', 'vegan_restaurant', 'vegetarian_restaurant',
  'mediterranean_restaurant', 'greek_restaurant', 'american_restaurant', 'middle_eastern_restaurant'
]);

const INVALID_TYPES = new Set([
  'miniature_golf', 'amusement_center', 'bowling_alley', 'movie_theater', 'night_club',
  'bar', 'stadium', 'sports_club', 'gym', 'shopping_mall', 'grocery_store',
  'convenience_store', 'gas_station', 'hotel', 'lodging'
]);

const EXCLUDED_KEYWORDS = /putt|golf|bowling|cinema|theater|theatre|arcade|trampoline|escape room|laser tag|axe throwing|mini golf|go kart|water park|amusement/i;

const FIELD_MASK = [
  'places.displayName', 'places.formattedAddress', 'places.location', 'places.rating',
  'places.userRatingCount', 'places.priceLevel', 'places.currentOpeningHours',
  'places.types', 'places.editorialSummary', 'places.businessStatus', 'places.photos',
  'places.delivery', 'places.takeout', 'places.dineIn',
  'places.servesWine', 'places.servesBeer', 'places.servesCocktails',
].join(',');

function isValidRestaurant(place) {
  const types = place.types || [];
  const name = (place.displayName?.text || '').toLowerCase();
  
  // Exclude if name contains non-restaurant keywords
  if (EXCLUDED_KEYWORDS.test(name)) return false;
  
  // REQUIRED: at least one broad food type indicator
  const FOOD_TYPES = new Set(['restaurant', 'food', 'meal_takeaway', 'meal_delivery', 'cafe', 'bakery', 'fast_food_restaurant']);
  const hasFoodType = types.some(t => FOOD_TYPES.has(t));
  if (!hasFoodType) return false;
  
  // Exclude if ONLY invalid types with no food type
  const hasInvalidType = types.some(t => INVALID_TYPES.has(t));
  const hasValidType = types.some(t => VALID_FOOD_TYPES.has(t));
  if (hasInvalidType && !hasValidType) return false;
  
  // Exclude ghost listings only
  const rating = place.rating || 0;
  const reviewCount = place.userRatingCount || 0;
  if (rating === 0 && reviewCount === 0) return false;
  
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
    const radiusMeters = Math.round((radius_miles || 5) * 1609.34);
    const cuisineList = Array.isArray(cuisine) ? cuisine : (cuisine ? [cuisine] : []);
    const serviceList = Array.isArray(service) ? service : (service ? [service] : []);
    const excludeNames = (exclude || []).map(n => n.toLowerCase());

    if (isNaN(lat) || isNaN(lng)) {
      return Response.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    // STEP 1: Build queries
    // Broad queries use includedPrimaryTypes for general discovery (All mode)
    const broadQueryConfigs = [
      { textQuery: 'restaurant', includedPrimaryTypes: ['restaurant', 'fast_food_restaurant', 'cafe'] },
      { textQuery: 'food near me' },
    ];

    const targetedQueryConfigs = cuisineList
      .map(c => {
        const cfg = CUISINE_SEARCH_QUERIES[c.toLowerCase()];
        return cfg ? { ...cfg, _cuisine: c } : null;
      })
      .filter(Boolean);

    // When cuisines are selected, skip broad queries and only run targeted ones
    const allQueryConfigs = cuisineList.length > 0
      ? targetedQueryConfigs
      : broadQueryConfigs;

    const allResults = await Promise.all(
      allQueryConfigs.map(async (config) => {
        const { textQuery, _cuisine, ...extraParams } = config;
        const body = {
          textQuery,
          maxResultCount: 20,
          locationRestriction: {
            circle: {
              center: { latitude: lat, longitude: lng },
              radius: Math.max(radiusMeters, 8047)
            }
          },
          ...(open_now ? { openNow: true } : {}),
          ...extraParams,
        };
        const res = await fetch(
          'https://places.googleapis.com/v1/places:searchText',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': GMAPS_KEY || '',
              'X-Goog-FieldMask': FIELD_MASK,
            },
            body: JSON.stringify(body),
          }
        );
        const data = await res.json();
        return (data.places || []).map(p => ({ ...p, _sourceCuisine: _cuisine || null }));
      })
    );

    // STEP 2: Combine and deduplicate by name + address
    const seen = new Set();
    const broadData = {
      places: allResults.flat().filter(p => {
        const key = `${p.displayName?.text}|${p.formattedAddress}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
    };

    // Helper function to map place to restaurant
    function mapPlaceToRestaurant(p) {
      const pLat = p.location?.latitude;
      const pLng = p.location?.longitude;
      const d = (pLat && pLng) ? distanceMiles(lat, lng, pLat, pLng) : null;

      const nameLower = (p.displayName?.text || '').toLowerCase();
      const descLower = (p.editorialSummary?.text || '').toLowerCase();
      const typesArr = p.types || [];
      // If this place came from a targeted cuisine query, use that label directly
      let cuisineLabel = p._sourceCuisine
        ? p._sourceCuisine.charAt(0).toUpperCase() + p._sourceCuisine.slice(1)
        : 'Restaurant';

      if (cuisineLabel === 'Restaurant') {
        // Match by Google place types
        for (const [key, val] of Object.entries(CUISINE_KEYWORDS)) {
          if (typesArr.some(t => val.types.includes(t))) {
            cuisineLabel = key.charAt(0).toUpperCase() + key.slice(1);
            break;
          }
        }
      }

      // Final pass: check name + description keywords
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
        const photoName = p.photos[0].name;
        photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${GMAPS_KEY}`;
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

    // STEP 3: Filter and label results
    // STEP 3a: Run isValidRestaurant filter
    const validPlaces = (broadData.places || [])
      .filter(p => p.businessStatus !== 'CLOSED_PERMANENTLY')
      .filter(p => isValidRestaurant(p))
      .filter(p => !excludeNames.includes(p.displayName?.text?.toLowerCase()));

    // STEP 3b: Map to restaurant objects with cuisine labels
    const mappedRestaurants = validPlaces.map(mapPlaceToRestaurant);

    // STEP 4: Filter by actual user-selected distance
    const allRestaurants = mappedRestaurants.filter(
      r => r.distance_miles !== null && r.distance_miles <= (radius_miles || 5)
    );

    // STEP 5: Deduplicate by name (already done in combine step, but ensure)
    // STEP 6: Count cuisines from the distance-filtered set
    const cuisineCounts = {};
    allRestaurants.forEach(r => {
      cuisineCounts[r.cuisine] = (cuisineCounts[r.cuisine] || 0) + 1;
    });

    // STEP 7 & 8: availableCuisines with Restaurant always included
    const availableCuisines = [
      'Restaurant',
      ...Object.keys(cuisineCounts)
        .filter(c => c !== 'Restaurant' && cuisineCounts[c] >= 1)
    ].sort();

    console.log('Total unique places fetched:', broadData.places.length);
    console.log('After isValidRestaurant filter:', validPlaces.length);
    console.log('After distance filter (<= ' + (radius_miles || 5) + 'mi):', allRestaurants.length);
    console.log('Cuisine counts (from distance-filtered set):', cuisineCounts);
    console.log('Available cuisines:', availableCuisines);

    // STEP 9: Apply cuisine selection filter if user selected specific cuisines
    let filteredRestaurants = allRestaurants;
    if (cuisineList.length > 0) {
      filteredRestaurants = filteredRestaurants.filter(r =>
        cuisineList.some(c => r.cuisine.toLowerCase() === c.toLowerCase())
      );
    }

    // STEP 9b: Apply service filter
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

    // STEP 10: Fallback if filters produce 0 results
    let filterMismatch = false;
    if (filteredRestaurants.length === 0 && allRestaurants.length > 0) {
      filteredRestaurants = allRestaurants;
      filterMismatch = true;
    }

    // STEP 11: Sort
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
        totalFromGoogle: (broadData.places || []).length,
        afterFiltering: allRestaurants.length,
        cuisineCounts,
        sampleTypes: (broadData.places || []).slice(0, 8).map(p => ({
          name: p.displayName?.text,
          types: p.types,
          assignedCuisine: allRestaurants.find(
            r => r.name === p.displayName?.text
          )?.cuisine
        }))
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});