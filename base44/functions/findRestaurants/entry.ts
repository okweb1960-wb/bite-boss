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
  'american':      { words: ['american', 'burger', 'diner', 'bbq', 'barbecue', 'steakhouse', 'wings'], types: ['american_restaurant', 'hamburger_restaurant', 'steak_house', 'fast_food_restaurant'] },
  'mexican':       { words: ['mexican', 'taco', 'burrito', 'tex-mex', 'tamale', 'quesadilla'], types: ['mexican_restaurant'] },
  'italian':       { words: ['italian', 'pizza', 'pasta', 'trattoria'], types: ['italian_restaurant', 'pizza_restaurant'] },
  'pizza':         { words: ['pizza', 'pizzeria'], types: ['pizza_restaurant'] },
  'chinese':       { words: ['chinese', 'dim sum', 'cantonese', 'szechuan'], types: ['chinese_restaurant'] },
  'japanese':      { words: ['japanese', 'sushi', 'ramen', 'teriyaki', 'hibachi'], types: ['japanese_restaurant', 'ramen_restaurant', 'sushi_restaurant'] },
  'sushi':         { words: ['sushi', 'japanese'], types: ['sushi_restaurant', 'japanese_restaurant'] },
  'thai':          { words: ['thai'], types: ['thai_restaurant'] },
  'indian':        { words: ['indian', 'curry'], types: ['indian_restaurant'] },
  'mediterranean': { words: ['mediterranean', 'greek', 'falafel', 'kebab', 'gyro'], types: ['mediterranean_restaurant', 'greek_restaurant', 'middle_eastern_restaurant'] },
  'burgers':       { words: ['burger', 'hamburger', 'smash', 'wendy', 'mcdonald', 'whataburger', 'five guys', 'shake shack', 'culver'], types: ['hamburger_restaurant'] },
  'chicken':       { words: ['chicken', 'fried chicken', 'wings', 'cane', 'zaxby', 'kfc', 'popeyes', 'chick-fil', 'wingstop', 'raising'], types: ['chicken_restaurant'] },
  'sandwiches':    { words: ['sandwich', 'sub', 'deli', 'hoagie', 'subway', 'jimmy john', 'jersey mike', 'potbelly'], types: ['sandwich_shop'] },
  'bbq':           { words: ['bbq', 'barbecue', 'barbeque', 'smokehouse'], types: ['barbecue_restaurant'] },
  'seafood':       { words: ['seafood', 'fish', 'crab', 'lobster', 'shrimp', 'oyster'], types: ['seafood_restaurant'] },
  'breakfast':     { words: ['breakfast', 'brunch', 'pancake', 'waffle', 'omelette', 'diner', 'ihop', 'denny'], types: ['breakfast_restaurant', 'brunch_restaurant'] },
  'desserts':      { words: ['dessert', 'ice cream', 'bakery', 'cake', 'pastry', 'donut', 'yogurt'], types: ['ice_cream_shop', 'bakery', 'dessert_shop'] },
  'vegetarian':    { words: ['vegetarian', 'vegan', 'plant-based'], types: ['vegan_restaurant', 'vegetarian_restaurant'] },
  'vegan':         { words: ['vegan', 'plant-based'], types: ['vegan_restaurant'] },
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

    // STEP 1: Make broad API call with no cuisine filters
    const includedTypes = cuisineList.length > 0
      ? cuisineList.flatMap(c => 
          CUISINE_KEYWORDS[c.toLowerCase()]?.types || []
        ).filter(Boolean)
      : null;

    // Use searchText for broad discovery (returns more diverse results)
    // Use searchNearby only when specific cuisines are selected
    const useSearchText = !includedTypes;

    let broadRequestBody, broadEndpoint;
    if (useSearchText) {
      broadRequestBody = {
        textQuery: 'restaurant food dining',
        maxResultCount: 20,
        locationBias: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: radiusMeters
          }
        },
        ...(open_now ? { openNow: true } : {}),
      };
      broadEndpoint = 'https://places.googleapis.com/v1/places:searchText';
    } else {
      broadRequestBody = {
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: radiusMeters
          }
        },
        includedTypes,
        ...(open_now ? { openNow: true } : {}),
      };
      broadEndpoint = 'https://places.googleapis.com/v1/places:searchNearby';
    }

    const broadRes = await fetch(broadEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GMAPS_KEY || '',
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify(broadRequestBody),
    });

    const broadData = await broadRes.json();
    if (!broadRes.ok) return Response.json({ error: 'Google API Error', details: broadData }, { status: broadRes.status });

    // Helper function to map place to restaurant
    function mapPlaceToRestaurant(p) {
      const pLat = p.location?.latitude;
      const pLng = p.location?.longitude;
      const d = (pLat && pLng) ? distanceMiles(lat, lng, pLat, pLng) : null;

      let cuisineLabel = 'American';

      // First pass: match by Google place types (most reliable)
      for (const [key, val] of Object.entries(CUISINE_KEYWORDS)) {
        if (p.types?.some(t => val.types.includes(t))) {
          cuisineLabel = key.charAt(0).toUpperCase() + key.slice(1);
          break;
        }
      }

      // Second pass: only if still American, try name matching
      if (cuisineLabel === 'American') {
        for (const [key, val] of Object.entries(CUISINE_KEYWORDS)) {
          if (key === 'american') continue;
          if (val.words.some(w => 
            (p.displayName?.text || '').toLowerCase().includes(w)
          )) {
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
      };
    }

    // STEP 2: Process broad results
    const allRestaurants = (broadData.places || [])
      .filter(p => p.businessStatus !== 'CLOSED_PERMANENTLY')
      .filter(p => isValidRestaurant(p))
      .filter(p => !excludeNames.includes(p.displayName?.text?.toLowerCase()))
      .map(mapPlaceToRestaurant)
      .filter(r => r.distance_miles !== null && r.distance_miles <= (radius_miles || 5));

    console.log('Total places from Google:', (broadData.places || []).length);
    console.log('After filtering:', allRestaurants.length);
    console.log('Sample place types:', (broadData.places || []).slice(0, 5).map(p => ({
      name: p.displayName?.text,
      types: p.types
    })));
    console.log('Cuisine labels assigned:', allRestaurants.map(r => r.cuisine));

    // Count cuisines with 2+ restaurants
    const cuisineCounts = {};
    allRestaurants.forEach(r => {
      cuisineCounts[r.cuisine] = (cuisineCounts[r.cuisine] || 0) + 1;
    });
    const availableCuisines = Object.keys(cuisineCounts).filter(c => cuisineCounts[c] >= 1).sort();

    console.log('Cuisine counts:', cuisineCounts);
    console.log('Available cuisines:', availableCuisines);
    console.log('Restaurant cuisine mapping:', 
      allRestaurants.map(r => ({
        name: r.name,
        cuisine: r.cuisine
      }))
    );

    // STEP 3: Filter results based on user selections
    let filteredRestaurants = allRestaurants;
    if (cuisineList.length > 0) {
      filteredRestaurants = filteredRestaurants.filter(r => 
        cuisineList.some(c => r.cuisine.toLowerCase() === c.toLowerCase())
      );
    }

    filteredRestaurants = filteredRestaurants.sort((a, b) => {
      const ratingDiff = (b.rating || 0) - (a.rating || 0);
      if (Math.abs(ratingDiff) > 0.3) return ratingDiff;
      return (a.distance_miles || 0) - (b.distance_miles || 0);
    });

    return Response.json({ 
      restaurants: filteredRestaurants, 
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