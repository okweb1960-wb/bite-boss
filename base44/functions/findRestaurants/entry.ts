import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const GMAPS_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    console.log("DEBUG: Received Payload:", JSON.stringify(payload));

    const { latitude, longitude, radius_miles } = payload;

    // CRITICAL: Force coordinates to be numbers
    const lat = Number(latitude);
    const lng = Number(longitude);
    const radiusMeters = Math.round((radius_miles || 5) * 1609.34);

    if (isNaN(lat) || isNaN(lng)) {
      console.error("DEBUG: Invalid Coordinates received:", { latitude, longitude });
      return Response.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    // Simplified Test Call to Google
    const requestBody = {
      textQuery: `fast food burgers in 68154`,
      maxResultCount: 5,
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: radiusMeters
        }
      }
    };

    console.log("DEBUG: Sending to Google:", JSON.stringify(requestBody));

    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GMAPS_KEY || '',
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location'
      },
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("DEBUG: Google API Error:", JSON.stringify(data));
      return Response.json({ error: "Google API Error", details: data }, { status: res.status });
    }

    console.log("DEBUG: Google Success! Found:", data.places?.length || 0);
    return Response.json({ restaurants: data.places || [] });

  } catch (error) {
    console.error("DEBUG: CRASH in function:", error.stack);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});