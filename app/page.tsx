// app/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function Home() {
  const events: {id: number, title: string, date: Date, time: string, venueName: string, venueAddress: string, slug: string}[] = await prisma.event.findMany({
    orderBy: { date: "desc" },
  });
  return (
    <div className="space-y-10">
      <section className="text-center space-y-4">
        <h1 className="boho-h1" style={{ fontFamily: "var(--font-serif)" }}>
          Invitaciones de boda
        </h1>
        <p className="max-w-2xl mx-auto boho-muted">
          Crea tu evento, comparte la página con tus invitados, recolecta
          confirmaciones y administra una lista de regalos elegante con estilo
          boho chic.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/events/new" className="boho-btn">
            Crear evento
          </Link>
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        {events.map((ev) => (
          <Link
            key={ev.id}
            href={`/events/${ev.slug}`}
            className="boho-card p-5 block hover:shadow-md transition"
          >
            <h3 className="boho-h2" style={{ fontFamily: "var(--font-serif)" }}>
              {ev.title}
            </h3>
            <p className="boho-muted mt-1">
              {format(ev.date, "EEEE d 'de' MMMM y", { locale: es })} ·{" "}
              {ev.time}
            </p>
            <p className="mt-2 text-sm">
              {ev.venueName} — {ev.venueAddress}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
