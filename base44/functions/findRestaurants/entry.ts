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

    const { latitude, longitude, radius_miles, cuisine, service, open_now } = await req.json();
    if (!latitude || !longitude) return Response.json({ error: 'Coordinates required' }, { status: 400 });

    const radius = radius_miles || 5;
    const cuisineHint = cuisine ? ` Cuisine preference: ${cuisine}.` : '';
    const serviceHint = service ? ` Service style: ${service}.` : '';

    const prompt = `List up to 15 real restaurants near coordinates lat=${latitude} lon=${longitude} within ${radius} miles.${cuisineHint}${serviceHint}

Each restaurant must have these fields only:
- name (string): restaurant name
- cuisine (string): food type like Italian or Burgers
- street (string): street address only like "123 Main St"
- rating (number): like 4.2
- reviews (integer): number of reviews
- price (integer): 1 to 4
- open (boolean): is it currently open
- stype (string): Sit-down or Fast Food or Cafe or Counter
- lat (number): latitude
- lon (number): longitude`;

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