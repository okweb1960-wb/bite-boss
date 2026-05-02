const GMAPS_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

Deno.serve(async (req) => {
  try {
    const { address } = await req.json();
    if (!address) return Response.json({ error: 'Address required' }, { status: 400 });

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GMAPS_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'OK' || !data.results?.[0]) {
      return Response.json({ error: 'Location not found' }, { status: 404 });
    }

    const { lat, lng } = data.results[0].geometry.location;
    const formatted = data.results[0].formatted_address;
    return Response.json({ latitude: lat, longitude: lng, address: formatted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});