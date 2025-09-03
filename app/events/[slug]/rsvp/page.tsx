// app/events/[slug]/rsvp/page.tsx
import { prisma } from "@/lib/prisma";
import { respondRSVP } from "@/app/actions";
import { reserveGift} from "@/app/actions";

export default async function RSVPPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ code?: string | string[]; stage?: string }>;
}) {

  const { slug } = await params;
  const sp = await searchParams;
  const codeParam =
    typeof sp?.code === "string"
      ? sp.code
      : Array.isArray(sp?.code)
      ? sp.code[0] ?? ""
      : "";
  const stage = typeof sp?.stage === "string" ? sp.stage : "";

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

  const guestFromCode = codeParam
  ? await prisma.guest.findFirst({
      where: { eventId: event.id, invitationCode: codeParam },
      select: { id: true, name: true, email: true },
    })
  : null;

  const policyLabel = event.maxPlusOnesPerGuest === null || event.maxPlusOnesPerGuest === undefined
    ? "Selección libre"
    : event.maxPlusOnesPerGuest === 0
      ? "Sin acompañantes"
      : `Hasta ${event.maxPlusOnesPerGuest}`;

  return (
    <div className="max-w-3xl mx-auto boho-card p-6">
      <h1 className="boho-h2 mb-2" style={{ fontFamily: "var(--font-serif)" }}>
        {stage === "gifts" ? "Elige un regalo (opcional)" : "Confirmar asistencia"}
      </h1>
      <p className="boho-muted mb-6">{event.title}</p>

      {stage !== "gifts" ? (
        <>
          <p className="text-sm mb-6">
            Acompañantes permitidos: <b>{policyLabel}</b>
          </p>
          {/* === PASO 1: SOLO formulario RSVP === */}
          <form action={respondRSVP} className="space-y-4">
            <input type="hidden" name="slug" value={event.slug} />
            <input type="hidden" name="code" value={codeParam} />
            <div>
              <label>Nombre</label>
              <input name="name" required defaultValue={guestFromCode?.name} />
            </div>
            <div>
              <label>Email</label>
              <input name="email" type="email" required defaultValue={guestFromCode?.email} />
            </div>
            <div>
              <label>Asistencia</label>
              <select name="status" required>
                <option value="ACCEPTED">Asistiré</option>
                <option value="DECLINED">No podré asistir</option>
              </select>
            </div>
            <div>
              <label>Acompañantes</label>
              <input
                name="plusOnes"
                type="number"
                min={0}
                max={event.maxPlusOnesPerGuest ?? undefined}
                defaultValue={0}
              />
            </div>
            <div>
              <label>Mensaje para los novios (opcional)</label>
              <textarea name="message" rows={3} placeholder="¡Con mucho cariño!" />
            </div>
            {event.askDietaryRestrictions && (
              <div>
                <label>Restricciones alimentarias (opcional)</label>
                <textarea
                  name="dietary"
                  rows={2}
                  placeholder="Ej: vegetariano, sin gluten, alergia a frutos secos…"
                />
              </div>
            )}
            <button className="boho-btn" type="submit">
              {event.hasGiftList ? "Continuar a regalos" : "Enviar"}
            </button>
          </form>
        </>
      ) : (
        <>
          {/* === PASO 2: SOLO lista de regalos === */}
          {!event.hasGiftList ? (
            <p className="boho-muted">Este evento no tiene lista de regalos.</p>
          ) : event.gifts.length === 0 ? (
            <p className="boho-muted">Aún no hay regalos.</p>
          ) : (
            <ul className="mt-6 flex gap-4 w-full">
              {/* {event.gifts.map((g: Gift) => (
                <li key={g.id} className="p-4 border rounded-2xl">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-2">
                      <p className="font-semibold">{g.name}</p>
                      {g.description && (
                        <p className="text-sm boho-muted">{g.description}</p>
                      )}
                      <div className="text-sm mt-1 flex gap-2">
                        {typeof g.price === "number" && <span>${g.price.toFixed(0)}</span>}
                        {g.storeUrl && (
                          <a
                            className="underline"
                            href={g.storeUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Ver tienda
                          </a>
                        )}
                      </div>
                    </div>

                    <div>
                      {g.reservedById ? (
                        <span className="text-sm boho-muted">Reservado ✓</span>
                      ) : (
                        <form action={reserveGift} className="flex flex-col md:flex-row gap-2">
                          <input type="hidden" name="giftId" value={g.id} />
                          <input name="name" hidden required defaultValue={guestFromCode?.name} />
                          <input name="email" type="email" hidden required defaultValue={guestFromCode?.email} />
                          <button className="boho-btn" type="submit">Reservar</button>
                        </form>
                      )}
                    </div>
                  </div>
                </li>
              ))} */}
              {event.gifts.length === 0 ? (
            <p className="boho-muted mt-4">Aún no hay regalos.</p>
          ) : (
            <div className="overflow-x-auto mt-6 w-full">
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
                      : <form action={reserveGift} className="flex flex-col md:flex-row gap-2">
                          <input type="hidden" name="giftId" value={g.id} />
                          <input name="name" hidden required defaultValue={guestFromCode?.name} />
                          <input name="email" type="email" hidden required defaultValue={guestFromCode?.email} />
                          <button className="boho-btn" type="submit">Reservar</button>
                        </form>

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
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <a className="boho-outline" href={`/events/${event.slug}/rsvp${codeParam ? `?code=${encodeURIComponent(codeParam)}` : ""}`}>
              Volver a la invitación
            </a>
            <a className="boho-btn" href={`/events/${event.slug}${codeParam ? `?code=${encodeURIComponent(codeParam)}` : ""}`}>
              Finalizar
            </a>
          </div>
        </>
      )}
    </div>
  );
}
