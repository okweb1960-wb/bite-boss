import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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

    const { latitude, longitude, radius_miles, cuisine, service, open_now, exclude, location_text } = await req.json();
    if (!latitude || !longitude) return Response.json({ error: 'Coordinates required' }, { status: 400 });

    const radius = radius_miles || 5;
    const cuisineHint = cuisine ? ` Cuisine preference: ${cuisine}.` : '';
    const serviceHint = service ? ` Service style: ${service}.` : '';
    const locationHint = location_text ? ` The location is: ${location_text}.` : '';

    const excludeHint = exclude?.length ? ` Do NOT include these places: ${exclude.join(', ')}.` : '';
    const prompt = `List 8-10 real restaurants that are physically located in or very close to: ${location_text || `lat=${latitude} lon=${longitude}`}. Only include places within ${radius} miles of lat=${latitude} lon=${longitude}. Do NOT include restaurants from other cities or states.${cuisineHint}${serviceHint}${excludeHint}
Return JSON only. Fields per restaurant: name, cuisine, street, rating, reviews, price (1-4), open (bool), stype (Sit-down/Fast Food/Cafe/Counter), lat, lon.`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          restaurants: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                cuisine: { type: 'string' },
                street: { type: 'string' },
                rating: { type: 'number' },
                reviews: { type: 'integer' },
                price: { type: 'integer' },
                open: { type: 'boolean' },
                stype: { type: 'string' },
                lat: { type: 'number' },
                lon: { type: 'number' },
              },
              required: ['name', 'cuisine', 'rating', 'lat', 'lon']
            }
          }
        },
        required: ['restaurants']
      }
    });

    const excludeNames = exclude?.length ? exclude.map(n => n.toLowerCase()) : [];

    let restaurants = (res?.restaurants || []).map(r => {
      const d = (r.lat && r.lon) ? distanceMiles(latitude, longitude, r.lat, r.lon) : null;
      return {
        name: r.name,
        cuisine: r.cuisine,
        address: r.street || '',
        rating: r.rating,
        review_count: r.reviews,
        price_level: r.price,
        open_now: r.open,
        service_type: r.stype,
        lat: r.lat,
        lon: r.lon,
        distance_miles: d,
        distance: d === null ? '' : d < 0.1 ? `${Math.round(d * 5280)} ft` : `${d.toFixed(1)} mi`,
      };
    })
    .filter(r => !excludeNames.includes(r.name.toLowerCase()))
    .filter(r => r.distance_miles === null || r.distance_miles <= radius + 1)
    .sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));

    if (open_now) {
      restaurants = restaurants.filter(r => r.open_now);
    }

    return Response.json({ restaurants });

  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});