import { NextResponse } from "next/server";

// Cache for superfast responses
const statesCache: Record<string, { name: string; code?: string }[]> = {};
const citiesCache: Record<string, string[]> = {};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get("country");
  const state = searchParams.get("state");

  if (!country) {
    return NextResponse.json({ error: "Country parameter required" }, { status: 400 });
  }

  // 1. If state parameter provided -> fetch Cities
  if (state) {
    const cacheKey = `${country}__${state}`;
    if (citiesCache[cacheKey]) {
      return NextResponse.json({ cities: citiesCache[cacheKey] });
    }

    try {
      const res = await fetch("https://countriesnow.space/api/v0.1/countries/state/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, state }),
        next: { revalidate: 86400 } // cache 24h
      });

      const data = await res.json();
      if (!data.error && Array.isArray(data.data) && data.data.length > 0) {
        citiesCache[cacheKey] = data.data;
        return NextResponse.json({ cities: data.data });
      }
    } catch (e) {
      console.error("Cities API fetch failed:", e);
    }

    return NextResponse.json({ cities: [] });
  }

  // 2. Fetch States for country
  if (statesCache[country]) {
    return NextResponse.json({ states: statesCache[country] });
  }

  try {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country }),
      next: { revalidate: 86400 }
    });

    const data = await res.json();
    if (!data.error && data.data?.states && Array.isArray(data.data.states)) {
      const statesList = data.data.states.map((s: any) => ({
        name: s.name,
        code: s.state_code
      }));
      statesCache[country] = statesList;
      return NextResponse.json({ states: statesList });
    }
  } catch (e) {
    console.error("States API fetch failed:", e);
  }

  return NextResponse.json({ states: [] });
}
