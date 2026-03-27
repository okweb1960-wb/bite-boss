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
    const now = new Date().toLocaleString('en-US', { weekday: 'long', hour: 'numeric', minute: 'numeric', timeZone: 'America/Chicago' });

    const cuisineHint = cuisine ? `Prefer ${cuisine} cuisine.` : '';
    const serviceHint = service ? `Prefer ${service} style.` : '';
    const openHint = open_now ? 'Only include restaurants open right now.' : '';

    const prompt = `Find up to 15 real restaurants within ${radius} miles of GPS coordinates lat=${latitude}, lon=${longitude}. Current time: ${now}. ${cuisineHint} ${serviceHint} ${openHint}

Return a JSON object with a "restaurants" array. Keep each entry SHORT - only these fields:
name, cuisine, address, distance (e.g. "0.4 mi"), rating (number), review_count (number), price_level (1-4), open_now (boolean), service_type, description (one sentence), lat (number), lon (number).

Only include real restaurants that actually exist at those coordinates. Sort by distance.`;

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
                address: { type: 'string' },
                distance: { type: 'string' },
                rating: { type: 'number' },
                review_count: { type: 'number' },
                price_level: { type: 'number' },
                open_now: { type: 'boolean' },
                service_type: { type: 'string' },
                description: { type: 'string' },
                lat: { type: 'number' },
                lon: { type: 'number' },
              }
            }
          }
        }
      }
    });

    let restaurants = res?.restaurants || [];

    // Verify distances using coordinates where available
    restaurants = restaurants
      .map(r => {
        if (r.lat && r.lon) {
          const d = distanceMiles(latitude, longitude, r.lat, r.lon);
          return { ...r, distance_miles: d, distance: d < 0.1 ? `${Math.round(d * 5280)} ft` : `${d.toFixed(1)} mi` };
        }
        return r;
      })
      .filter(r => !r.lat || !r.lon || (r.distance_miles || 0) <= radius + 1)
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