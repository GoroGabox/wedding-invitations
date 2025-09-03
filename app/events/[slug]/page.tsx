// app/events/[slug]/page.tsx
import { prisma } from "@/lib/prisma";
import { addGift, addGuest, regenerateInviteCode, ensureInviteCode } from "@/app/actions";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { auth } from "@/auth";
import { Guest } from "@prisma/client";
import MapView from "../../components/MapView";
import Countdown from "../../components/Countdown";
import FloralDivider from "../../components/FloralDivider";
import ShareButtons from "../../components/ShareButtons";
import CopyField from "../../components/CopyField";
import Timeline, { TimelineItem } from "../../components/Timeline";
import type { Prisma } from "@prisma/client";

function toTimelineItems(value: Prisma.JsonValue | null | undefined): TimelineItem[] {
  if (!value || !Array.isArray(value)) return [];

  // Definimos el “raw” esperado
  type Raw = {
    time?: string; hora?: string;
    title?: string; titulo?: string;
    description?: string; descripcion?: string;
  };

  // Chequeo la forma mínima de cada ítem (objeto plano)
  const raw = value as unknown as Raw[];
  return raw
    .filter((it) => it && typeof it === "object")
    .map((it) => ({
      time: it.time ?? it.hora ?? "",
      title: it.title ?? it.titulo ?? "",
      description: it.description ?? it.descripcion ?? "",
    }))
    .filter((it) => it.title.trim().length > 0);
}

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ code?: string | string[] }>;
}) {
    
  const session = await auth();
  const user = session?.user;
  const { slug } = await params;
  const sp = await searchParams;
  const codeParam =
    typeof sp?.code === "string"
      ? sp.code
      : Array.isArray(sp?.code)
      ? sp.code[0] ?? ""
      : "";
  
  const event = await prisma.event.findUnique({
    where: { slug: slug },
    include: { 
        gifts: { 
          orderBy: { id: "asc" },
          include: { reservedBy: { select: { name: true, email: true } } },
        }, 
        guests: true 
    },
  });

  if (!event) return <div className="boho-card p-6">Evento no encontrado.</div>;

  const isOwner = user?.id === event.ownerId;

  // si es PRIVADO y no es owner, exigir code válido
  if (event.visibility === "PRIVATE" && !isOwner) {
    const guest = codeParam
      ? await prisma.guest.findFirst({ where: { eventId: event.id, invitationCode: codeParam } })
      : null;

    if (!guest) {
      return (
        <div className="boho-card p-6">
          <h2 className="boho-h2" style={{ fontFamily: "var(--font-serif)" }}>Evento privado</h2>
          <p className="mt-2">Necesitas tu <b>enlace de invitación</b> para acceder.</p>
          <p className="mt-2 text-sm boho-muted">Revisa tu correo o solicita a los anfitriones que te reenvíen el enlace.</p>
        </div>
      );
    }
  }

  const policyLabel = event.maxPlusOnesPerGuest === null || event.maxPlusOnesPerGuest === undefined
    ? "Selección libre"
    : event.maxPlusOnesPerGuest === 0
      ? "Sin acompañantes"
      : `Hasta ${event.maxPlusOnesPerGuest}`;


  const mapHref = event.mapUrl ?? ((event.latitude != null && event.longitude != null)
    ? `https://www.google.com/maps?q=${event.latitude},${event.longitude}`
    : null);

  if (!user) {
    const dt = new Date(event.date);
    const [hh, mm] = (event.time || "00:00").split(":");
    dt.setHours(Number(hh) || 0, Number(mm) || 0, 0, 0);
    const targetISO = dt.toISOString();

    return (
      <div className="space-y-10">
        <section
          className="relative overflow-hidden rounded-2xl border"
          style={{
            background:
              event.coverImageUrl
                ? `url(${event.coverImageUrl}) center/cover no-repeat`
                : "radial-gradient(1000px 600px at 120% 10%, rgba(185,196,177,.18), transparent), radial-gradient(1200px 800px at 10% -10%, rgba(195,107,94,.16), transparent), var(--sand)",
          }}
        >
          <div className="absolute inset-0 bg-white/50 mix-blend-soft-light" />
          <div className="relative px-6 py-10 md:px-10 md:py-14 text-center">
            <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full ring-2 ring-terracotta/50 bg-white/70 backdrop-blur">
              <span
                className="text-xl font-semibold"
                style={{ fontFamily: "var(--font-serif)" }}
                title="Monograma"
              >
                ✿
              </span>
            </div>

            <h1 className="boho-h1" style={{ fontFamily: "var(--font-serif)" }}>
              {event.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 bg-white/70">
                <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-70"><path fill="currentColor" d="M7 10h5v5H7zM3 8h18v12H3zM8 3h2v3H8zm6 0h2v3h-2z"/></svg>
                {format(event.date, "EEEE d 'de' MMMM y", { locale: es })} · {event.time}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 bg-white/70">
                <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-70"><path fill="currentColor" d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7m0 9a2 2 0 1 0-2-2a2 2 0 0 0 2 2"/></svg>
                {event.venueName} — {event.venueAddress}
              </span>
            </div>

            <div className="mt-6">
              <Countdown targetISO={targetISO} />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href={`/events/${event.slug}/rsvp${codeParam ? `?code=${encodeURIComponent(codeParam)}` : ""}`} className="boho-btn">
                Confirmar asistencia
              </Link>
              {mapHref && (
                <a className="boho-outline" href={mapHref} target="_blank">
                  Ver en Google Maps
                </a>
              )}
              <a className="boho-outline" href={`/api/ics/${event.slug}`} target="_blank" rel="noopener noreferrer">
                Agregar al calendario
              </a>
              <ShareButtons
                title={event.title}
                text={`${format(event.date, "EEEE d 'de' MMMM y", { locale: es })} · ${event.time} · ${event.venueName}`}
              />
            </div>
          </div>
        </section>

        <FloralDivider />

        <section className="boho-card p-6">
          <p className="boho-muted text-sm mb-2">
            Acompañantes permitidos: <b>
            {policyLabel}
            </b>
          </p>

          {event.description && (
            <p className="mt-2 whitespace-pre-wrap leading-relaxed">{event.description}</p>
          )}

          {(() => {
            const items = toTimelineItems(event.timeline);
            return items.length > 0 ? (
              <>
                <div className="boho-divider">
                  <span className="text-xs tracking-widest uppercase boho-muted">
                    Cronograma del día
                  </span>
                </div>
                <Timeline items={items} />
              </>
            ) : null;
          })()}

          {event.askDietaryRestrictions && (
            <div className="mt-6 rounded-2xl border p-4 bg-[color:rgba(185,196,177,.18)]">
              <p className="text-sm">
                <b>Alimentación:</b> si tienes alguna <i>restricción alimentaria</i>, por favor indícalo al confirmar tu asistencia.
              </p>
            </div>
          )}

          {event.latitude != null && event.longitude != null && (
            <div className="mt-6">
              <MapView position={{ lat: event.latitude, lng: event.longitude }} />
            </div>
          )}
        </section>
      </div>
    );
  }

  if(isOwner) return (
    <div className="space-y-10">

      <section className="boho-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="boho-h2" style={{ fontFamily: "var(--font-serif)" }}>
            Lista de regalos
          </h2>
        </div>
        <div className="boho-divider">
          <span className="text-xs tracking-widest uppercase boho-muted">
            Opcional
          </span>
        </div>
        <form action={addGift} className="grid md:grid-cols-4 gap-3">
          <input type="hidden" name="eventId" value={event.id} />
          <input
            name="name"
            placeholder="Juego de sábanas"
            className="md:col-span-1"
          />
          <input
            name="description"
            placeholder="Algodón 400 hilos"
            className="md:col-span-1"
          />
          <input
            name="price"
            type="number"
            step="0.01"
            placeholder="Precio"
            className="md:col-span-1"
          />
          <input type="hidden" name="slug" value={event.slug} />
          <input type="hidden" name="code" value={codeParam ?? ""} />
          <div className="flex gap-2 md:col-span-1">
            <input
              name="storeUrl"
              placeholder="Enlace opcional"
              className="flex-1"
            />
            <button className="boho-btn" type="submit">
              Agregar
            </button>
          </div>
        </form>

        <ul className="mt-6 grid grid-cols-1 gap-4">
          {event.gifts.length === 0 ? (
            <p className="boho-muted mt-4">Aún no hay regalos.</p>
          ) : (
            <div className="overflow-x-auto mt-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left boho-muted">
                    <th className="py-2">Regalo</th>
                    <th>Descripción</th>
                    <th>Precio</th>
                    <th>Enlace</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {event.gifts.map((g) => {
                    const estado = g.reservedBy
                      ? <span className="text-sm boho-muted">Reservado por {g.reservedBy.name} ✓</span>
                      : <span className="text-sm boho-muted">Disponible</span>;

                    return (
                      <tr key={g.id} className="border-t">
                        <td className="py-2 font-semibold">{g.name}</td>
                        <td className="boho-muted">{g.description ?? "—"}</td>
                        <td>{typeof g.price === "number" ? `$${g.price.toFixed(0)}` : "—"}</td>
                        <td>
                          {g.storeUrl ? (
                            <a href={g.storeUrl} target="_blank" rel="noreferrer" className="underline">
                              Ver tienda
                            </a>
                          ) : (
                            <span className="boho-muted">Sin enlace</span>
                          )}
                        </td>
                        <td>{estado}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </ul>
      </section>

      <section className="boho-card p-6">
        <h2 className="boho-h2" style={{ fontFamily: "var(--font-serif)" }}>
          Invitados 
        </h2>
        <div className="boho-divider" />
        <form action={addGuest} className="grid md:grid-cols-5 gap-3">
          <input type="hidden" name="eventId" value={event.id} />
          <input name="name" placeholder="Nombre" required />
          <input name="email" placeholder="Email" type="email" required />
          <input
            name="plusOnes"
            placeholder="Acompañantes"
            type="number"
            min="0"
          />
          <button className="boho-btn md:col-span-1" type="submit">
            Agregar
          </button>
        </form>
        <div className="overflow-x-auto mt-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left boho-muted">
                <th className="py-2">Nombre</th>
                <th className="py-2">Email</th>
                <th className="py-2">Estado</th>
                <th className="py-2">Acomp.</th>
                <th className="py-2">Invitación</th>
              </tr>
            </thead>
            <tbody>
              {event.guests.map(async (gu:Guest) => {
                const invitePath = gu.invitationCode ? `/i/${gu.invitationCode}` : "";
                return (
                  <tr key={gu.id} className="border-t">
                    <td className="py-2">{gu.name}</td>
                    <td className="py-2">{gu.email}</td>
                    <td className="py-2">{gu.status}</td>
                    <td className="py-2">{gu.plusOnes}</td>
                    <td className="py-2 w-5">
                      {event.visibility === "PRIVATE" ? (
                        <div className="flex flex-col gap-2">
                          {gu.invitationCode ? (
                            <>
                              <div className="flex gap-2">
                                <CopyField href={invitePath} />
                                <form action={regenerateInviteCode}>
                                  <input type="hidden" name="guestId" value={gu.id} />
                                  <button className="boho-outline" type="submit">Regenerar</button>
                                </form>
                              </div>
                            </>
                          ) : (
                            <form action={ensureInviteCode}>
                              <input type="hidden" name="guestId" value={gu.id} />
                              <button className="boho-btn" type="submit">Generar enlace</button>
                            </form>
                          )}
                        </div>
                      ) : (
                        <span className="boho-muted text-xs">Evento público</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
