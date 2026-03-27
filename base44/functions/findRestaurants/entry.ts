import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function distanceMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
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

    const prompt = `I am at exact GPS coordinates: latitude ${latitude}, longitude ${longitude}.

Find me real, currently operating restaurants within EXACTLY ${radius} mile${radius !== 1 ? 's' : ''} of those coordinates. This is critical — do NOT include any restaurant farther than ${radius} mile${radius !== 1 ? 's' : ''} away.

${cuisine ? `Cuisine preference: ${cuisine}.` : 'Any cuisine.'}
${service ? `Service style preference: ${service}.` : ''}
${open_now ? 'Only include places that are open right now.' : ''}

For each restaurant, calculate the actual distance in miles from lat ${latitude}, lon ${longitude} using the Haversine formula and only include it if it is ≤ ${radius} miles away.

Return a JSON array of up to 20 restaurants. Each object must have:
- name (string)
- cuisine (string)
- address (string, full street address)
- distance (string, e.g. "0.3 mi" or "400 ft" — must be ≤ ${radius} mi)
- distance_miles (number, actual calculated distance)
- rating (number 1-5, one decimal, based on real reviews if known)
- review_count (number)
- price_level (number 1-4)
- open_now (boolean)
- service_type (string: "Sit-down", "Takeout", "Fast Food", "Café", etc.)
- description (string, one short sentence)
- lat (number, restaurant latitude)
- lon (number, restaurant longitude)

Sort by distance ascending. Return ONLY the JSON array.`;

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
                distance_miles: { type: 'number' },
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

    // Double-check distances using actual coordinates if provided
    restaurants = restaurants
      .map(r => {
        if (r.lat && r.lon) {
          const actualDist = distanceMiles(latitude, longitude, r.lat, r.lon);
          return {
            ...r,
            distance_miles: actualDist,
            distance: actualDist < 0.1 ? `${Math.round(actualDist * 5280)} ft` : `${actualDist.toFixed(1)} mi`
          };
        }
        return r;
      })
      .filter(r => !r.lat || !r.lon || r.distance_miles <= radius)
      .sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));

    return Response.json({ restaurants });

  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});