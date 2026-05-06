import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const GMAPS_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

function distanceMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const CUISINE_TYPE_MAP = {
  'all':           ['restaurant', 'cafe', 'bakery', 'meal_takeaway', 'fast_food_restaurant'],
  'american':      ['american_restaurant'],
  'burgers':       ['hamburger_restaurant'],
  'fast food':     ['fast_food_restaurant', 'hamburger_restaurant'],
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
  'bars':          ['bar', 'pub'],
  'sports bar':    ['bar', 'pub'],
};

const PRIMARY_TYPE_LABEL = {
  'hamburger_restaurant':     'Burgers',
  'fast_food_restaurant':     'Fast Food',
  'american_restaurant':      'American',
  'mexican_restaurant':       'Mexican',
  'italian_restaurant':       'Italian',
  'pizza_restaurant':         'Pizza',
  'chinese_restaurant':       'Chinese',
  'japanese_restaurant':      'Japanese',
  'ramen_restaurant':         'Japanese',
  'sushi_restaurant':         'Sushi',
  'thai_restaurant':          'Thai',
  'indian_restaurant':        'Indian',
  'mediterranean_restaurant': 'Mediterranean',
  'greek_restaurant':         'Mediterranean',
  'middle_eastern_restaurant':'Mediterranean',
  'barbecue_restaurant':      'BBQ',
  'seafood_restaurant':       'Seafood',
  'breakfast_restaurant':     'Breakfast',
  'brunch_restaurant':        'Breakfast',
  'cafe':                     'Cafe',
  'ice_cream_shop':           'Desserts',
  'dessert_shop':             'Desserts',
  'bakery':                   'Desserts',
  'restaurant':               'Restaurant',
  'bar':                      'Bar & Pub',
  'pub':                      'Bar & Pub',
};

const PRICE_MAP = {
  PRICE_LEVEL_FREE: 1,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

const EXCLUDED_KEYWORDS = /putt|golf|bowling|cinema|theater|theatre|arcade|trampoline|escape room|laser tag|axe throwing|mini golf|go kart|water park|amusement/i;

const FIELD_MASK = [
  'places.displayName', 'places.formattedAddress', 'places.location', 'places.rating',
  'places.userRatingCount', 'places.priceLevel', 'places.currentOpeningHours',
  'places.types', 'places.primaryType', 'places.editorialSummary', 'places.businessStatus',
  'places.photos', 'places.delivery', 'places.takeout', 'places.dineIn',
  'places.photos.authorAttributions', 'places.servesWine', 'places.servesBeer', 'places.servesCocktails',
  'places.goodForWatchingSports',
].join(',');

async function searchText(textQuery, radiusMeters, lat, lng, open_now) {
  const body = {
    textQuery,
    pageSize: 60,
    locationBias: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: radiusMeters,
      }
    },
    ...(open_now ? { openNow: true } : {}),
  };
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GMAPS_KEY || '',
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) console.error('[searchText error]', JSON.stringify(data.error));
  return data.places || [];
}

async function searchNearby(types, radiusMeters, lat, lng, open_now, usePrimaryTypes = true) {
  const body = {
    ...(usePrimaryTypes
      ? { includedPrimaryTypes: types }
      : { includedTypes: types }),
    maxResultCount: 20,
    rankPreference: 'DISTANCE',
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: radiusMeters,
      }
    },
    ...(open_now ? { openNow: true } : {}),
  };
  const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GMAPS_KEY || '',
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) console.error('[searchNearby error]', JSON.stringify(data.error));
  return data.places || [];
}


function mapPlace(p, lat, lng) {
  const pLat = p.location?.latitude;
  const pLng = p.location?.longitude;
  const d = (pLat && pLng) ? distanceMiles(lat, lng, pLat, pLng) : null;

  const cuisineLabel = PRIMARY_TYPE_LABEL[p.primaryType] || 'Restaurant';

  let photoUrl = null;
  if (p.photos && p.photos.length > 0) {
    const userPhoto = p.photos.find(ph => {
      const attr = ph.authorAttributions?.[0];
      return attr && attr.displayName !== 'Google' && attr.uri && !attr.uri.includes('google.com/maps');
    });
    const selected = userPhoto || p.photos[Math.min(1, p.photos.length - 1)];
    photoUrl = `https://places.googleapis.com/v1/${selected.name}/media?maxWidthPx=800&key=${GMAPS_KEY}`;
  }

  return {
    name: p.displayName?.text || 'Unknown Restaurant',
    cuisine: cuisineLabel,
    primaryType: p.primaryType || '',
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
    good_for_sports: p.goodForWatchingSports || false,
  };
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { latitude, longitude, radius_miles, cuisine, service, open_now, exclude, price_level_max } = payload;

    const lat = parseFloat(Number(latitude).toFixed(6));
    const lng = parseFloat(Number(longitude).toFixed(6));
    const radiusMeters = Math.round((radius_miles || 5) * 1609.34);
    const cuisineList = (Array.isArray(cuisine) ? cuisine : (cuisine ? [cuisine] : [])).map(c => c.toLowerCase());
    const serviceList = Array.isArray(service) ? service : (service ? [service] : []);
    const excludeNames = (exclude || []).map(n => n.toLowerCase());



    if (isNaN(lat) || isNaN(lng)) {
      return Response.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    let rawPlaces = [];

    if (cuisineList.length === 0) {
      // All cuisines — 3 parallel searchNearby calls with broad radius
      const broadRadius = Math.max(radiusMeters, 8047);
      const [batch1, batch2, batch3] = await Promise.all([
        searchNearby(['restaurant', 'american_restaurant'], broadRadius, lat, lng, open_now),
        searchNearby([
          'fast_food_restaurant', 'hamburger_restaurant', 'mexican_restaurant',
          'italian_restaurant', 'pizza_restaurant', 'chinese_restaurant',
          'japanese_restaurant', 'thai_restaurant', 'indian_restaurant',
        ], broadRadius, lat, lng, open_now),
        searchNearby([
          'mediterranean_restaurant', 'greek_restaurant', 'barbecue_restaurant',
          'seafood_restaurant', 'breakfast_restaurant', 'cafe',
          'sushi_restaurant', 'ramen_restaurant', 'ice_cream_shop', 'bakery',
        ], broadRadius, lat, lng, open_now),
      ]);
      rawPlaces = [...batch1, ...batch2, ...batch3];
    } else {
      // Specific cuisines — one call per selected cuisine, in parallel
      const searchRadius = Math.max(radiusMeters, 8047);
      const results = await Promise.all(
        cuisineList.map(async key => {
          if (key === 'burgers') {
            const [r1, r2, r3] = await Promise.all([
              searchText('burger restaurant', searchRadius, lat, lng, open_now),
              searchText('burger bar grill', searchRadius, lat, lng, open_now),
              searchText('hamburger smash burger', searchRadius, lat, lng, open_now),
            ]);
            return [...r1, ...r2, ...r3];
          }
          if (key === 'breakfast') {
            const [nearbyResults, textResults] = await Promise.all([
              searchNearby(['breakfast_restaurant', 'brunch_restaurant'], searchRadius, lat, lng, open_now, true),
              searchText('breakfast brunch restaurant', searchRadius, lat, lng, open_now),
            ]);
            return [...nearbyResults, ...textResults];
          }
          if (key === 'bars') {
            return searchNearby(['bar', 'pub'], searchRadius, lat, lng, open_now, false);
          }
          if (key === 'sports bar') {
            return searchNearby(['bar', 'pub'], searchRadius, lat, lng, open_now, false);
          }
          const types = CUISINE_TYPE_MAP[key] || ['restaurant'];
          return searchNearby(types, searchRadius, lat, lng, open_now);
        })
      );
      rawPlaces = results.flat();
    }

    // Deduplicate by name + address
    const seen = new Set();
    const unique = rawPlaces.filter(p => {
      const key = `${p.displayName?.text}|${p.formattedAddress}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Map to restaurant objects
    const mapped = unique.map(p => mapPlace(p, lat, lng));

    // Filter
    const filtered = mapped
      .filter(r => {
        const p = unique.find(u => u.displayName?.text === r.name && u.formattedAddress === r.address);
        return p?.businessStatus !== 'CLOSED_PERMANENTLY';
      })
      .filter(r => !(r.rating === 0 && r.review_count === 0))
      .filter(r => !EXCLUDED_KEYWORDS.test(r.name))
      .filter(r => !excludeNames.includes(r.name.toLowerCase()))
      .filter(r => r.distance_miles !== null && r.distance_miles <= (radius_miles || 5) * 1.1);

    // Price filter
    if (price_level_max && price_level_max < 4) {
      filtered = filtered.filter(r => r.price_level === null || r.price_level <= price_level_max);
    }

    // Sports bar post-filter
    let filteredFinal = filtered;
    if (cuisineList.includes('sports bar')) {
      const sportsFiltered = filtered.filter(r => r.good_for_sports === true);
      filteredFinal = sportsFiltered.length >= 3 ? sportsFiltered : filtered;
    }

    // Service filter
    let results = filteredFinal;
    if (serviceList.length > 0) {
      const serviceFiltered = filteredFinal.filter(r =>
        serviceList.some(s => {
          if (s === 'dine_in') return r.dine_in === true;
          if (s === 'takeout') return r.takeout === true;
          if (s === 'delivery') return r.delivery === true;
          return true;
        })
      );
      results = serviceFiltered.length > 0 ? serviceFiltered : filteredFinal;
    }

    // Sort: rating desc, then distance asc
    results.sort((a, b) => {
      const ratingDiff = (b.rating || 0) - (a.rating || 0);
      if (Math.abs(ratingDiff) > 0.3) return ratingDiff;
      return (a.distance_miles || 0) - (b.distance_miles || 0);
    });

    const filterMismatch = serviceList.length > 0 &&
      filteredFinal.filter(r => serviceList.some(s => {
        if (s === 'dine_in') return r.dine_in === true;
        if (s === 'takeout') return r.takeout === true;
        if (s === 'delivery') return r.delivery === true;
        return true;
      })).length === 0;

    return Response.json({
      restaurants: results,
      filterMismatch,
      debug: {
        totalFromGoogle: unique.length,
        afterFiltering: results.length,
      }
    });

  } catch (error) {
    console.error('[findRestaurants error]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});