import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const GMAPS_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

function distanceMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

async function fetchPlaces(latitude, longitude, radiusMeters, keyword, pagetoken) {
  let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radiusMeters}&type=restaurant&key=${GMAPS_KEY}`;
  if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
  if (pagetoken) url += `&pagetoken=${encodeURIComponent(pagetoken)}`;
  const res = await fetch(url);
  const data = await res.json();
  console.log('Google status:', data.status, 'count:', data.results?.length, 'error:', data.error_message);
  return data;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { latitude, longitude, radius_miles, cuisine, service, open_now, exclude } = await req.json();
    if (!latitude || !longitude) return Response.json({ error: 'Coordinates required' }, { status: 400 });

    const radiusMeters = Math.round((radius_miles || 5) * 1609.34);
    const keyword = [cuisine, service].filter(Boolean).join(' ') || undefined;
    const excludeNames = (exclude || []).map(n => n.toLowerCase());

    const data = await fetchPlaces(latitude, longitude, radiusMeters, keyword);
    let places = data.results || [];

    if (data.next_page_token && places.length < 30) {
      await new Promise(r => setTimeout(r, 2000));
      const data2 = await fetchPlaces(latitude, longitude, radiusMeters, keyword, data.next_page_token);
      places = [...places, ...(data2.results || [])];
    }

    let restaurants = places
      .filter(p => !excludeNames.includes(p.name.toLowerCase()))
      .map(p => {
        const lat = p.geometry?.location?.lat;
        const lon = p.geometry?.location?.lng;
        const d = (lat && lon) ? distanceMiles(latitude, longitude, lat, lon) : null;
        const isOpen = p.opening_hours?.open_now;
        return {
          name: p.name,
          cuisine: p.types?.find(t => !['restaurant','food','point_of_interest','establishment'].includes(t))?.replace(/_/g, ' ') || 'Restaurant',
          address: p.vicinity || '',
          rating: p.rating,
          review_count: p.user_ratings_total,
          price_level: p.price_level,
          open_now: isOpen,
          lat,
          lon,
          distance_miles: d,
          distance: d === null ? '' : d < 0.1 ? `${Math.round(d * 5280)} ft` : `${d.toFixed(1)} mi`,
        };
      });

    if (open_now) {
      restaurants = restaurants.filter(r => r.open_now === true);
    }

    restaurants.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));

    return Response.json({ restaurants, status: data.status });

  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});