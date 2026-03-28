import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const GMAPS_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { latitude, longitude } = await req.json();
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GMAPS_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'OK') {
      return Response.json({ error: data.status }, { status: 400 });
    }

    const address = data.results[0]?.formatted_address || '';
    return Response.json({ address });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});