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

const FIELD_MASK = [
  'places.displayName', 'places.formattedAddress', 'places.location', 'places.rating',
  'places.userRatingCount', 'places.priceLevel', 'places.currentOpeningHours',
  'places.types', 'places.editorialSummary', 'places.businessStatus',
  'places.delivery', 'places.takeout', 'places.dineIn',
  'places.servesWine', 'places.servesBeer', 'places.servesCocktails',
].join(',');

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

    const isFastFood = serviceList.includes('fast food');
    const queryTerm = cuisineList.length > 0 ? cuisineList[0] : 'restaurants';

    const requestBody = {
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: radiusMeters
        }
      },
      includedTypes: cuisineList.length > 0
        ? cuisineList.flatMap(c => CUISINE_KEYWORDS[c.toLowerCase()]?.types || [])
        : ['restaurant'],
      ...(open_now ? { openNow: true } : {}),
    };

    const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GMAPS_KEY || '',
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.currentOpeningHours,places.types,places.editorialSummary,places.businessStatus,places.delivery,places.takeout,places.dineIn,places.servesWine,places.servesBeer,places.servesCocktails',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();
    if (!res.ok) return Response.json({ error: 'Google API Error', details: data }, { status: res.status });

    const restaurants = (data.places || [])
      .filter(p => p.businessStatus !== 'CLOSED_PERMANENTLY')
      .filter(p => !excludeNames.includes(p.displayName?.text?.toLowerCase()))
      .map(p => {
        const pLat = p.location?.latitude;
        const pLng = p.location?.longitude;
        const d = (pLat && pLng) ? distanceMiles(lat, lng, pLat, pLng) : null;

        const nameLower = (p.displayName?.text || '').toLowerCase();
        const descLower = (p.editorialSummary?.text || '').toLowerCase();
        const haystack = nameLower + ' ' + descLower;
        let cuisineLabel = 'Restaurant';

        for (const [key, val] of Object.entries(CUISINE_KEYWORDS)) {
          if (val.words.some(w => haystack.includes(w)) || p.types?.some(t => val.types.includes(t))) {
            cuisineLabel = key.charAt(0).toUpperCase() + key.slice(1);
            break;
          }
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
        };
      })
      .filter(r => r.distance_miles !== null && r.distance_miles <= (radius_miles || 5))
      .sort((a, b) => {
        const ratingDiff = (b.rating || 0) - (a.rating || 0);
        if (Math.abs(ratingDiff) > 0.3) return ratingDiff;
        return (a.distance_miles || 0) - (b.distance_miles || 0);
      });

    return Response.json({ restaurants });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});