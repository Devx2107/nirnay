import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!start || !end) {
    return NextResponse.json({ error: 'Missing start or end coordinates' }, { status: 400 });
  }

  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey || apiKey === "your-ors-api-key" || apiKey.includes("your_openrouteservice_api_key_here")) {
    return NextResponse.json({
      mock: true,
      route: [start.split(',').map(Number).reverse(), end.split(',').map(Number).reverse()],
      distance: 0,
      duration: 0
    });
  }

  const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${start}&end=${end}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenRouteService API Error:", errorData);
      return NextResponse.json({ error: 'Failed to fetch route from provider' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("OpenRouteService request failed:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
