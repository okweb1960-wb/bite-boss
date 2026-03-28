import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const GMAPS_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

function distanceMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Map service filter values to Places API (New) included types
const SERVICE_TYPE_MAP = {
  'sit-down': 'sit_down_dining',
  'fast food': 'fast_food_restaurant',
  'takeout': 'meal_takeaway',
  'delivery': 'delivery_restaurant',
  'cafe': 'cafe',
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

    // Build text query incorporating both cuisine and service filters
    const cuisinePart = cuisineList.length > 0 ? cuisineList.join(' ') : '';
    const servicePart = serviceList.length > 0 ? serviceList.join(' ') : '';
    const textQuery = [cuisinePart, servicePart, 'restaurant'].filter(Boolean).join(' ');

    const requestBody = {
      textQuery,
      locationBias: {
        circle: {
          center: { latitude, longitude },
          radius: radiusMeters,
        }
      },
      maxResultCount: 20,
      ...(open_now ? { openNow: true } : {}),
    };

    const fieldMask = 'places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.currentOpeningHours,places.types,places.editorialSummary';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GMAPS_KEY,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();
    console.log('Places API (New) response status:', res.status, 'places count:', data.places?.length ?? 0);

    if (data.error) {
      console.error('Places API error:', JSON.stringify(data.error));
      return Response.json({ error: data.error.message }, { status: 500 });
    }

    const restaurants = (data.places || [])
      .filter(p => !excludeNames.includes(p.displayName?.text?.toLowerCase()))
      .map(p => {
        const lat = p.location?.latitude;
        const lon = p.location?.longitude;
        const d = (lat && lon) ? distanceMiles(latitude, longitude, lat, lon) : null;
        const cuisine = p.types?.find(t =>
          !['restaurant','food','point_of_interest','establishment','meal_takeaway','meal_delivery','cafe'].includes(t)
        )?.replace(/_/g, ' ') || 'Restaurant';

        const priceMap = { PRICE_LEVEL_FREE: 1, PRICE_LEVEL_INEXPENSIVE: 1, PRICE_LEVEL_MODERATE: 2, PRICE_LEVEL_EXPENSIVE: 3, PRICE_LEVEL_VERY_EXPENSIVE: 4 };

        return {
          name: p.displayName?.text || 'Unknown',
          cuisine,
          address: p.formattedAddress || '',
          rating: p.rating,
          review_count: p.userRatingCount,
          price_level: priceMap[p.priceLevel] || null,
          open_now: p.currentOpeningHours?.openNow,
          description: p.editorialSummary?.text || '',
          lat,
          lon,
          distance_miles: d,
          distance: d === null ? '' : d < 0.1 ? `${Math.round(d * 5280)} ft` : `${d.toFixed(1)} mi`,
        };
      })
      .filter(r => r.distance_miles === null || r.distance_miles <= (radius_miles || 5))
      .sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));

    return Response.json({ restaurants });

  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});