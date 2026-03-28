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

    const cuisineList = Array.isArray(cuisine) ? cuisine : (cuisine ? [cuisine] : []);
    const serviceList = Array.isArray(service) ? service : (service ? [service] : []);
    const keyword = [...cuisineList, ...serviceList].filter(Boolean).join(' ');

    const params = new URLSearchParams({
      location: `${latitude},${longitude}`,
      radius: radiusMeters,
      type: 'restaurant',
      key: GMAPS_KEY,
    });
    if (keyword) params.set('keyword', keyword);
    if (open_now) params.set('opennow', 'true');

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`;
    const res = await fetch(url);
    const data = await res.json();

    console.log('Places API status:', data.status, 'count:', data.results?.length);
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Places API error:', JSON.stringify(data));
    }

    let restaurants = (data.results || [])
      .filter(p => !excludeNames.includes(p.name?.toLowerCase()))
      .map(p => {
        const lat = p.geometry?.location?.lat;
        const lon = p.geometry?.location?.lng;
        const d = (lat && lon) ? distanceMiles(latitude, longitude, lat, lon) : null;
        return {
          name: p.name || 'Unknown',
          cuisine: p.types?.find(t => !['restaurant','food','point_of_interest','establishment','meal_takeaway','meal_delivery'].includes(t))?.replace(/_/g, ' ') || 'Restaurant',
          address: p.vicinity || '',
          rating: p.rating,
          review_count: p.user_ratings_total,
          price_level: p.price_level,
          open_now: p.opening_hours?.open_now,
          lat,
          lon,
          distance_miles: d,
          distance: d === null ? '' : d < 0.1 ? `${Math.round(d * 5280)} ft` : `${d.toFixed(1)} mi`,
        };
      });

    // Filter strictly by radius
    restaurants = restaurants.filter(r => r.distance_miles === null || r.distance_miles <= (radius_miles || 5));
    restaurants.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));

    return Response.json({ restaurants });

  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});