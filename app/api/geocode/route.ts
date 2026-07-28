import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pin = searchParams.get("pin");
  const country = searchParams.get("country"); // e.g. 'us', 'in', 'gb'

  if (!pin) {
    return NextResponse.json({ error: "No pin provided" }, { status: 400 });
  }

  try {
    // Construct query. If country is provided, use structured search
    const queryUrl = country 
      ? `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(pin)}&countrycodes=${encodeURIComponent(country)}&format=json&addressdetails=1&limit=1`
      : `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(pin)}&format=json&addressdetails=1&limit=1`;

    // We use a custom User-Agent to comply with Nominatim's usage policy
    const res = await fetch(queryUrl, {
      headers: {
        "User-Agent": "Eshop-Store-App/1.0 (admin@eshop.com)"
      }
    });

    if (!res.ok) {
      return NextResponse.json({ error: "API error", location: pin });
    }

    const data = await res.json();
    if (data && data.length > 0) {
      const address = data[0].address;
      
      // Try to extract city/town and country
      const city = address?.city || address?.town || address?.village || address?.county || address?.state_district;
      const country = address?.country;

      if (city && country) {
        return NextResponse.json({ location: `${city}, ${country}` });
      } else if (data[0].display_name) {
        // Fallback to splitting display_name
        const parts = data[0].display_name.split(", ");
        const shortName = parts.length >= 3 ? `${parts[0]}, ${parts[parts.length-1]}` : data[0].display_name;
        return NextResponse.json({ location: shortName });
      }
    }

    if (country) {
      return NextResponse.json({ error: "Invalid PIN code for selected country" });
    }
    return NextResponse.json({ location: pin });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch", location: pin });
  }
}
