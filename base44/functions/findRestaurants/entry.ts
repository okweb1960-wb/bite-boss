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

const CUISINE_TYPE_MAP = {
  'burgers':       ['hamburger_restaurant', 'fast_food_restaurant'],
  'fast food':     ['fast_food_restaurant', 'hamburger_restaurant'], // used for post-filter label matching
  'mexican':       ['mexican_restaurant'],
  'italian':       ['italian_restaurant'],
  'pizza':         ['pizza_restaurant'],
  'chinese':       ['chinese_restaurant'],
  'japanese':      ['japanese_restaurant', 'ramen_restaurant'],
  'sushi':         ['sushi_restaurant'],
  'thai':          ['thai_restaurant'],
  'indian':        ['indian_restaurant'],
  'mediterranean': ['mediterranean_restaurant', 'greek_restaurant', 'middle_eastern_restaurant'],
  'bbq':           ['barbecue_restaurant'],
  'seafood':       ['seafood_restaurant'],
  'breakfast':     ['breakfast_restaurant', 'brunch_restaurant'],
  'cafe':          ['cafe'],
  'desserts':      ['ice_cream_shop', 'dessert_shop', 'bakery'],
  'american':      ['american_restaurant'],
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

    async function runSearchText(textQuery, includedType, cuisineLabel) {
      const body = {
        textQuery,
        includedType,
        strictTypeFiltering: false,
        pageSize: 20,
        locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: Math.max(radiusMeters, 4828) } },
        rankPreference: 'DISTANCE',
        ...(open_now ? { openNow: true } : {}),
      };
      console.log(`[searchText][${cuisineLabel}] query: "${textQuery}"`);
      const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': GMAPS_KEY || '', 'X-Goog-FieldMask': FIELD_MASK },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) console.error(`[searchText error] ${JSON.stringify(data.error)}`);
      return (data.places || []).map(p => ({ ...p, _sourceCuisine: cuisineLabel }));
    }

    async function runNearbySearch(includedTypes, cuisineLabel, usePrimaryTypes = false) {
      const typeKey = usePrimaryTypes ? 'includedPrimaryTypes' : 'includedTypes';
      const body = {
        [typeKey]: includedTypes,
        maxResultCount: 20,
        rankPreference: 'DISTANCE',
        locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: radiusMeters } },
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
      // PATH A — No cuisine filter: 3 parallel searchNearby calls by distance
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
      // PATH B — Cuisine filter: special handling for fast food, otherwise searchNearby
      queryPromises = cuisineList.flatMap(c => {
        const key = c.toLowerCase();

        if (key === 'fast food') {
          // Fast food uses searchText to catch chains like McDonald's, Wendy's, Burger King
          // which use 'hamburger_restaurant' primaryType, not 'fast_food_restaurant'
          return [
            runSearchText("mcdonalds wendys burger king whataburger sonic dairy queen freddy's five guys", 'hamburger_restaurant', c),
            runSearchText("chick fil a popeyes kfc raising canes wingstop zaxbys church's chicken", 'fast_food_restaurant', c),
            runSearchText('fast food restaurant', 'fast_food_restaurant', c),
          ];
        }

        const types = CUISINE_TYPE_MAP[key] || ['restaurant'];
        return [
          runNearbySearch(types, c, true),           // Call 1: primaryType match (strict)
          runNearbySearch(['restaurant'], c, false), // Call 2: broad restaurant type
        ];
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

    const PRIMARY_TYPE_LABEL_MAP = {
      'hamburger_restaurant': 'Burgers',
      'fast_food_restaurant': 'Fast Food',
      'mexican_restaurant': 'Mexican',
      'italian_restaurant': 'Italian',
      'pizza_restaurant': 'Pizza',
      'chinese_restaurant': 'Chinese',
      'japanese_restaurant': 'Japanese',
      'korean_restaurant': 'Korean',
      'thai_restaurant': 'Thai',
      'indian_restaurant': 'Indian',
      'mediterranean_restaurant': 'Mediterranean',
      'greek_restaurant': 'Mediterranean',
      'middle_eastern_restaurant': 'Mediterranean',
      'barbecue_restaurant': 'BBQ',
      'seafood_restaurant': 'Seafood',
      'breakfast_restaurant': 'Breakfast',
      'brunch_restaurant': 'Breakfast',
      'sushi_restaurant': 'Sushi',
      'ramen_restaurant': 'Japanese',
      'american_restaurant': 'American',
      'cafe': 'Cafe',
      'ice_cream_shop': 'Desserts',
      'dessert_shop': 'Desserts',
      'bakery': 'Desserts',
    };

    function mapPlaceToRestaurant(p) {
      const pLat = p.location?.latitude;
      const pLng = p.location?.longitude;
      const d = (pLat && pLng) ? distanceMiles(lat, lng, pLat, pLng) : null;

      const nameLower = (p.displayName?.text || '').toLowerCase();
      const descLower = (p.editorialSummary?.text || '').toLowerCase();
      const typesArr = p.types || [];
      const primaryType = p.primaryType || '';

      // FIX 3 — Use primaryType first for accurate cuisine label
      let cuisineLabel = PRIMARY_TYPE_LABEL_MAP[primaryType] || null;

      if (!cuisineLabel) {
        cuisineLabel = p._sourceCuisine
          ? p._sourceCuisine.charAt(0).toUpperCase() + p._sourceCuisine.slice(1)
          : 'Restaurant';
      }

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
        primaryType,
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

    let validPlaces = uniquePlaces
      .filter(p => p.businessStatus !== 'CLOSED_PERMANENTLY')
      .filter(p => isValidRestaurant(p))
      .filter(p => !excludeNames.includes(p.displayName?.text?.toLowerCase()));

    const mappedRestaurants = validPlaces.map(mapPlaceToRestaurant);

    // For cuisine searches, filter by primaryType OR matching cuisine label
    let filteredByCuisine = mappedRestaurants;
    if (cuisineList.length > 0) {
      const isFastFoodSearch = cuisineList.some(c => c.toLowerCase() === 'fast food');
      const allCuisineTypes = new Set(cuisineList.flatMap(c => CUISINE_TYPE_MAP[c.toLowerCase()] || []));
      const cuisineLabelsLower = cuisineList.map(c => c.toLowerCase());

      filteredByCuisine = mappedRestaurants
        .map(r => {
          // For fast food searches, reclassify hamburger_restaurant chains as "Fast Food"
          if (isFastFoodSearch && r.primaryType === 'hamburger_restaurant') {
            return { ...r, cuisine: 'Fast Food' };
          }
          return r;
        })
        .filter(r => {
          if (allCuisineTypes.has(r.primaryType)) return true;
          // Keep generic 'restaurant' primaryType if cuisine label matches word detection
          if (r.primaryType === 'restaurant' && cuisineLabelsLower.includes(r.cuisine.toLowerCase())) return true;
          return false;
        });
    }

    // FIX 2 — Name-based exclusion for burger/fast food searches
    const isBurgerSearch = cuisineList.some(c => ['burgers', 'fast food'].includes(c.toLowerCase()));
    if (isBurgerSearch) {
      const NON_BURGER_WORDS = ['taqueria', 'taco', 'oyster', 'sushi', 'ramen', 'pho', 'thai', 'indian', 'curry', 'chinese', 'korean', 'dim sum', 'mediterranean', 'greek', 'italian', 'pizza', 'seafood', 'fish', 'crab', 'lobster'];
      filteredByCuisine = filteredByCuisine.filter(r => {
        const name = r.name.toLowerCase();
        return !NON_BURGER_WORDS.some(w => name.includes(w));
      });
    }

    // locationRestriction guarantees results within radius — no buffer needed
    const allRestaurants = filteredByCuisine.filter(
      r => r.distance_miles !== null && r.distance_miles <= (radius_miles || 5)
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
    console.log('After distance filter (<= ' + (radius_miles || 5) + 'mi):', allRestaurants.length);
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