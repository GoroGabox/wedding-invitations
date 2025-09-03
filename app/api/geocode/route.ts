export const runtime = "nodejs";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  if (!q || q.trim().length < 3) {
    return Response.json([]);
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "5");

  const ua = `boho-invites/1.0 (${process.env.NOMINATIM_EMAIL ?? "you@example.com"})`;
  const res = await fetch(url.toString(), {
    headers: { "User-Agent": ua, "Accept-Language": "es" },
  });

  if (!res.ok) {
    return Response.json([], { status: 200 });
  }

  const data: Array<{ display_name: string; lat: string; lon: string }> = await res.json();
  const results = data.map((d) => ({
    label: d.display_name,
    lat: parseFloat(d.lat),
    lon: parseFloat(d.lon),
  }));

  return Response.json(results);
}
