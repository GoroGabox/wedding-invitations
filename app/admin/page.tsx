// app/admin/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { deleteEvent } from "../actions";

function requireUserId(id: number | string | null | undefined) {
  const n = Number(id);
  if (!id || Number.isNaN(n)) throw new Error("No autenticado");
  return n;
}

export default async function AdminPage() {
  const session = await auth();
  const userId = requireUserId(session?.user?.id);
  const events: {id: number, title: string, date: Date, time: string, venueName: string, venueAddress: string, slug: string}[] = await prisma.event.findMany({
    where: { ownerId: userId ?? 0 },
    orderBy: { date: "asc" },
  });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="boho-h2" style={{ fontFamily: "var(--font-serif)" }}>
          Mis eventos
        </h1>
        <Link href="/events/new" className="boho-btn">
          Crear evento
        </Link>
      </div>
      <ul className="grid md:grid-cols-2 gap-4">
        {events.map((ev) => (
          <li key={ev.id} className="boho-card p-4">
            <form action={deleteEvent} className="space-y-4">
              <div className="flex justify-between gap-4">
                <Link href={`/events/${ev.slug}`} className="font-semibold">
                  {ev.title}
                </Link>
                <input type="number" name="eventId" value={ev.id} hidden readOnly/>
                <button type="submit" className="boho-outline">
                  X
                </button>
              </div>
              <p className="boho-muted text-sm">
                {new Date(ev.date).toLocaleDateString()}
              </p>
            </form>
          </li>
        ))}
        {events.length === 0 && (
          <p className="boho-muted">Aún no tienes eventos.</p>
        )}
      </ul>
    </div>
  );
}