import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const GMAPS_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

function distanceMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Cuisine keyword → name/type keywords for post-fetch filtering
const CUISINE_KEYWORDS = {
  'american': ['american', 'burger', 'diner', 'bbq', 'barbecue', 'steakhouse', 'wings'],
  'mexican': ['mexican', 'taco', 'burrito', 'tex-mex', 'tamale', 'quesadilla'],
  'italian': ['italian', 'pizza', 'pasta', 'trattoria', 'osteria'],
  'pizza': ['pizza', 'pizzeria'],
  'chinese': ['chinese', 'dim sum', 'cantonese', 'szechuan'],
  'japanese': ['japanese', 'sushi', 'ramen', 'teriyaki', 'hibachi'],
  'sushi': ['sushi', 'japanese'],
  'thai': ['thai'],
  'indian': ['indian', 'curry'],
  'mediterranean': ['mediterranean', 'greek', 'falafel', 'kebab', 'gyro'],
  'burgers': ['burger', 'hamburger', 'smash'],
  'sandwiches': ['sandwich', 'sub', 'deli', 'hoagie', 'subway', 'jimmy john'],
  'bbq': ['bbq', 'barbecue', 'barbeque', 'smokehouse'],
  'seafood': ['seafood', 'fish', 'crab', 'lobster', 'shrimp', 'oyster'],
  'breakfast': ['breakfast', 'brunch', 'pancake', 'waffle', 'omelette', 'diner', 'ihop', 'dennys'],
  'desserts': ['dessert', 'ice cream', 'bakery', 'cake', 'pastry', 'donut', 'yogurt'],
  'vegetarian': ['vegetarian', 'vegan', 'plant-based'],
  'vegan': ['vegan', 'plant-based'],
};

// Service filter → post-fetch checks against raw place data
const SERVICE_FIELD_MAP = {
  'fast food': (p) => p.types?.some(t => ['fast_food_restaurant', 'meal_takeaway'].includes(t)),
  'sit-down': (p) => p.dineIn === true || p.servesDinner === true || p.servesLunch === true,
  'takeout': (p) => p.takeout === true || p.types?.some(t => ['meal_takeaway', 'fast_food_restaurant'].includes(t)),
  'delivery': (p) => p.delivery === true || p.types?.includes('meal_delivery'),
  'cafe': (p) => p.types?.some(t => ['cafe', 'coffee_shop', 'bakery'].includes(t)),
};

// Expanded fieldMask including all service amenity boolean fields
const FIELD_MASK = [
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.priceLevel',
  'places.currentOpeningHours',
  'places.types',
  'places.editorialSummary',
  'places.businessStatus',
  'places.delivery',
  'places.takeout',
  'places.dineIn',
  'places.servesBreakfast',
  'places.servesLunch',
  'places.servesDinner',
  'places.servesBrunch',
  'places.servesWine',
  'places.servesBeer',
  'places.servesCocktails',
  'places.servesVegetarianFood',
  'places.outdoorSeating',
  'places.goodForChildren',
  'places.restroom',
].join(',');

// All food-related types to cast a broad net via nearbySearch
const ALL_FOOD_TYPES = [
  'restaurant',
  'fast_food_restaurant',
  'cafe',
  'bakery',
  'bar',
  'meal_takeaway',
  'meal_delivery',
  'sandwich_shop',
  'pizza_restaurant',
  'hamburger_restaurant',
  'mexican_restaurant',
  'chinese_restaurant',
  'japanese_restaurant',
  'thai_restaurant',
  'indian_restaurant',
  'italian_restaurant',
  'seafood_restaurant',
  'steak_house',
  'american_restaurant',
  'breakfast_restaurant',
  'brunch_restaurant',
  'ice_cream_shop',
];

const SYSTEM_TYPES = new Set([
  'restaurant','food','point_of_interest','establishment',
  'meal_takeaway','meal_delivery','cafe','store','bar'
]);

const PRICE_MAP = {
  PRICE_LEVEL_FREE: 1,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4
};

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

    // Use nearbySearch which supports includedTypes (array) — casts the widest possible net
    const requestBody = {
      includedTypes: ALL_FOOD_TYPES,
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { latitude, longitude },
          radius: radiusMeters,
        }
      },
      ...(open_now ? { openNow: true } : {}),
    };

    const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GMAPS_KEY,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();
    console.log('nearbySearch status:', res.status, 'places count:', data.places?.length ?? 0);

    if (data.error) {
      console.error('Places API error:', JSON.stringify(data.error));
      return Response.json({ error: data.error.message }, { status: 500 });
    }

    // Map raw places to our restaurant shape
    let restaurants = (data.places || [])
      .filter(p => p.businessStatus !== 'CLOSED_PERMANENTLY')
      .filter(p => !excludeNames.includes(p.displayName?.text?.toLowerCase()))
      .map(p => {
        const lat = p.location?.latitude;
        const lon = p.location?.longitude;
        const d = (lat && lon) ? distanceMiles(latitude, longitude, lat, lon) : null;

        const cuisineLabel = p.types?.find(t => !SYSTEM_TYPES.has(t))
          ?.replace(/_restaurant$/, '')
          ?.replace(/_/g, ' ') || 'Restaurant';

        return {
          name: p.displayName?.text || 'Unknown',
          cuisine: cuisineLabel.charAt(0).toUpperCase() + cuisineLabel.slice(1),
          address: p.formattedAddress || '',
          rating: p.rating,
          review_count: p.userRatingCount,
          price_level: PRICE_MAP[p.priceLevel] || null,
          open_now: p.currentOpeningHours?.openNow,
          description: p.editorialSummary?.text || '',
          lat,
          lon,
          distance_miles: d,
          distance: d === null ? '' : d < 0.1 ? `${Math.round(d * 5280)} ft` : `${d.toFixed(1)} mi`,
          _raw: p,
        };
      })
      .filter(r => r.distance_miles === null || r.distance_miles <= (radius_miles || 5));

    // POST-FETCH: filter by cuisine keywords against name + cuisine label
    if (cuisineList.length > 0) {
      restaurants = restaurants.filter(r => {
        return cuisineList.some(c => {
          const keywords = CUISINE_KEYWORDS[c.toLowerCase()] || [c.toLowerCase()];
          const haystack = (r.name + ' ' + r.cuisine).toLowerCase();
          return keywords.some(kw => haystack.includes(kw));
        });
      });
    }

    // POST-FETCH: filter by service type using amenity boolean fields
    if (serviceList.length > 0) {
      restaurants = restaurants.filter(r => {
        return serviceList.some(s => {
          const check = SERVICE_FIELD_MAP[s];
          return check ? check(r._raw) : true;
        });
      });
    }

    // Strip internal _raw field and sort by distance
    restaurants = restaurants
      .map(({ _raw, ...rest }) => rest)
      .sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));

    console.log('Final restaurants after filtering:', restaurants.length);
    return Response.json({ restaurants });

  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});