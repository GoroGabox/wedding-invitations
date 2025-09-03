export const runtime = "nodejs";
import { prisma } from "@/lib/prisma";

function toICSDate(d: Date) {
  // YYYYMMDDTHHMMSSZ
  return d.toISOString().replace(/[-:]/g, "").replace(".000Z", "Z");
}

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  // Acepta .../slug y .../slug.ics
  const raw = params.slug || "";
  const slug = raw.replace(/\.ics$/i, "");

  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) return new Response("Not found", { status: 404 });

  // Combina fecha + hora
  const start = new Date(event.date);
  const [hh, mm] = (event.time || "00:00").split(":");
  start.setHours(Number(hh) || 0, Number(mm) || 0, 0, 0);

  // Fin por defecto: +4h
  const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);

  const summary = event.title ?? "Evento";
  const location = [event.venueName, event.venueAddress].filter(Boolean).join(" · ");
  const description = (event.description ?? "").replace(/\r?\n/g, "\\n");

  const ics =
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//BohoInvites//ES
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:${slug}@bohoinvites
DTSTAMP:${toICSDate(new Date())}
DTSTART:${toICSDate(start)}
DTEND:${toICSDate(end)}
SUMMARY:${summary}
LOCATION:${location}
DESCRIPTION:${description}
END:VEVENT
END:VCALENDAR`;

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
