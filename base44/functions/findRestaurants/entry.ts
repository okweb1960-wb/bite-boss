import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const GMAPS_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

function distanceMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

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

    // Handle arrays or strings for cuisine/service
    const cuisineList = Array.isArray(cuisine) ? cuisine : (cuisine ? [cuisine] : []);
    const serviceList = Array.isArray(service) ? service : (service ? [service] : []);

    const body = {
      includedTypes: ['restaurant'],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { latitude, longitude },
          radius: radiusMeters,
        }
      },
    };

    const textParts = [...cuisineList, ...serviceList].filter(Boolean);
    if (textParts.length > 0) {
      body.textQuery = textParts.join(' ');
    }

    const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GMAPS_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.currentOpeningHours,places.location,places.types,places.primaryTypeDisplayName',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    console.log('Places API response:', JSON.stringify(data).slice(0, 500));

    let restaurants = (data.places || [])
      .filter(p => !excludeNames.includes(p.displayName?.text?.toLowerCase()))
      .map(p => {
        const lat = p.location?.latitude;
        const lon = p.location?.longitude;
        const d = (lat && lon) ? distanceMiles(latitude, longitude, lat, lon) : null;
        return {
          name: p.displayName?.text || 'Unknown',
          cuisine: p.primaryTypeDisplayName?.text || p.types?.find(t => !['restaurant','food','point_of_interest','establishment'].includes(t))?.replace(/_/g, ' ') || 'Restaurant',
          address: p.formattedAddress || '',
          rating: p.rating,
          review_count: p.userRatingCount,
          price_level: p.priceLevel ? { 'PRICE_LEVEL_FREE': 1, 'PRICE_LEVEL_INEXPENSIVE': 1, 'PRICE_LEVEL_MODERATE': 2, 'PRICE_LEVEL_EXPENSIVE': 3, 'PRICE_LEVEL_VERY_EXPENSIVE': 4 }[p.priceLevel] : undefined,
          open_now: p.currentOpeningHours?.openNow,
          lat,
          lon,
          distance_miles: d,
          distance: d === null ? '' : d < 0.1 ? `${Math.round(d * 5280)} ft` : `${d.toFixed(1)} mi`,
        };
      });

    if (open_now) {
      restaurants = restaurants.filter(r => r.open_now === true);
    }

    // Filter strictly by radius
    restaurants = restaurants.filter(r => r.distance_miles === null || r.distance_miles <= (radius_miles || 5));

    restaurants.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));

    return Response.json({ restaurants, _debug: { status: res?.status, error: data?.error, places_count: data?.places?.length } });

  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});