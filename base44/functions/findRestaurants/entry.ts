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

const SERVICE_FIELD_MAP = {
  'fast food': (p) => {
    const isCheap = p.priceLevel === 'PRICE_LEVEL_INEXPENSIVE' || p.priceLevel === 'PRICE_LEVEL_MODERATE';
    const isFastType = p.types?.some(t => ['fast_food_restaurant', 'hamburger_restaurant', 'meal_takeaway'].includes(t));
    const noAlcohol = !p.servesBeer && !p.servesWine && !p.servesCocktails;
    return isFastType && (isCheap || noAlcohol);
  },
  'sit-down':  (p) => p.dineIn === true || p.servesDinner === true || p.servesLunch === true,
  'takeout':   (p) => p.takeout === true || p.types?.some(t => ['meal_takeaway', 'fast_food_restaurant'].includes(t)),
  'delivery':  (p) => p.delivery === true || p.types?.includes('meal_delivery'),
  'cafe':      (p) => p.types?.some(t => ['cafe', 'coffee_shop', 'bakery'].includes(t)),
};

const FIELD_MASK = [
  'places.displayName', 'places.formattedAddress', 'places.location', 'places.rating',
  'places.userRatingCount', 'places.priceLevel', 'places.currentOpeningHours',
  'places.types', 'places.editorialSummary', 'places.businessStatus',
  'places.delivery', 'places.takeout', 'places.dineIn', 'places.servesBreakfast',
  'places.servesLunch', 'places.servesDinner', 'places.servesBrunch',
  'places.servesWine', 'places.servesBeer', 'places.servesCocktails',
  'places.servesVegetarianFood', 'places.outdoorSeating', 'places.goodForChildren',
  'places.restroom',
].join(',');

const ALL_FOOD_TYPES = [
  'restaurant', 'fast_food_restaurant', 'cafe', 'bakery', 'bar',
  'meal_takeaway', 'meal_delivery', 'sandwich_shop', 'pizza_restaurant',
  'hamburger_restaurant', 'mexican_restaurant', 'chinese_restaurant',
  'japanese_restaurant', 'thai_restaurant', 'indian_restaurant',
  'italian_restaurant', 'seafood_restaurant', 'steak_house', 'american_restaurant',
  'breakfast_restaurant', 'brunch_restaurant', 'ice_cream_shop',
];

const SYSTEM_TYPES = new Set(['restaurant', 'food', 'point_of_interest', 'establishment', 'meal_takeaway', 'meal_delivery', 'cafe', 'store', 'bar']);
const PRICE_MAP = { PRICE_LEVEL_FREE: 1, PRICE_LEVEL_INEXPENSIVE: 1, PRICE_LEVEL_MODERATE: 2, PRICE_LEVEL_EXPENSIVE: 3, PRICE_LEVEL_VERY_EXPENSIVE: 4 };

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const { latitude, longitude, radius_miles, cuisine, service, open_now, exclude } = payload;
    if (!latitude || !longitude) return Response.json({ error: 'Coordinates required' }, { status: 400 });

    const radiusMeters = Math.round((radius_miles || 5) * 1609.34);
    const excludeNames = (exclude || []).map(n => n.toLowerCase());
    const cuisineList = Array.isArray(cuisine) ? cuisine : (cuisine ? [cuisine] : []);
    const serviceList = Array.isArray(service) ? service : (service ? [service] : []);

    let placesApiEndpoint = 'https://places.googleapis.com/v1/places:searchNearby';
    let requestBody;

    if (cuisineList.length === 1) {
      placesApiEndpoint = 'https://places.googleapis.com/v1/places:searchText';
      const isFastFood = serviceList.includes('fast food');
      const queryPrefix = isFastFood ? 'Fast Food ' : 'Best ';

      requestBody = {
        textQuery: `${queryPrefix}${cuisineList[0]} near me`,
        maxResultCount: 60,
        locationBias: {
          circle: { center: { latitude, longitude }, radius: radiusMeters }
        },
        ...(isFastFood ? { includedPrimaryTypes: ['fast_food_restaurant', 'hamburger_restaurant'] } : {}),
        ...(open_now ? { openNow: true } : {}),
      };
    } else {
      requestBody = {
        includedTypes: ALL_FOOD_TYPES,
        maxResultCount: 60,
        locationRestriction: {
          circle: { center: { latitude, longitude }, radius: radiusMeters }
        },
        ...(open_now ? { openNow: true } : {}),
      };
    }

    const res = await fetch(placesApiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': GMAPS_KEY, 'X-Goog-FieldMask': FIELD_MASK },
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();
    if (data.error) return Response.json({ error: data.error.message }, { status: 500 });

    let restaurants = (data.places || [])
      .filter(p => p.businessStatus !== 'CLOSED_PERMANENTLY')
      .filter(p => !excludeNames.includes(p.displayName?.text?.toLowerCase()))
      .map(p => {
        const lat = p.location?.latitude;
        const lon = p.location?.longitude;
        const d = (lat && lon) ? distanceMiles(latitude, longitude, lat, lon) : null;

        const rawTypes = p.types || [];
        const haystack = ((p.displayName?.text || '') + ' ' + (p.editorialSummary?.text || '')).toLowerCase();
        let cuisineLabel = 'Restaurant';

        for (const key of Object.keys(CUISINE_KEYWORDS)) {
          const entry = CUISINE_KEYWORDS[key];
          if ((entry.words || []).some(w => haystack.includes(w)) || (entry.types || []).some(t => rawTypes.includes(t))) {
            cuisineLabel = key.charAt(0).toUpperCase() + key.slice(1);
            break;
          }
        }

        if (cuisineLabel === 'Restaurant') {
          const fallback = rawTypes.find(t => !SYSTEM_TYPES.has(t));
          if (fallback) {
            cuisineLabel = fallback.replace(/_restaurant$/, '').replace(/_/g, ' ');
            cuisineLabel = cuisineLabel.charAt(0).toUpperCase() + cuisineLabel.slice(1);
          }
        }

        return {
          name: p.displayName?.text || 'Unknown',
          cuisine: cuisineLabel,
          address: p.formattedAddress || '',
          rating: p.rating,
          review_count: p.userRatingCount,
          price_level: PRICE_MAP[p.priceLevel] || null,
          open_now: p.currentOpeningHours?.openNow,
          description: p.editorialSummary?.text || '',
          lat, lon, distance_miles: d,
          distance: d === null ? '' : d < 0.1 ? `${Math.round(d * 5280)} ft` : `${d.toFixed(1)} mi`,
          _raw: p,
        };
      })
      .filter(r => r.distance_miles !== null && r.distance_miles <= (radius_miles || 5));

    if (serviceList.length > 0) {
      restaurants = restaurants.filter(r => serviceList.some(s => SERVICE_FIELD_MAP[s] ? SERVICE_FIELD_MAP[s](r._raw) : true));
    }

    const sorted = restaurants.map(({ _raw, ...rest }) => rest).sort((a, b) => {
      const ratingDiff = (b.rating || 0) - (a.rating || 0);
      if (Math.abs(ratingDiff) > 0.3) return ratingDiff;
      return (a.distance_miles || 0) - (b.distance_miles || 0);
    });

    return Response.json({ restaurants: sorted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});