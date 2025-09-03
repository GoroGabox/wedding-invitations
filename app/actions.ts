// app/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import slugify from "slugify";
import { auth } from "@/auth";
import { RSVPStatus } from "@prisma/client";

function nanoId(len = 24) {
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let id = "";
  for (let i = 0; i < len; i++) id += alphabet[Math.floor(Math.random() * alphabet.length)];
  return id;
}


export async function createEvent(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");

  const title = String(formData.get("title") || "").trim();
  const date = new Date(String(formData.get("date")));
  const time = String(formData.get("time") || "").trim();
  const venueName = String(formData.get("venueName") || "").trim();
  const venueAddress = String(formData.get("venueAddress") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const visibility = (String(formData.get("visibility") || "PUBLIC") as "PUBLIC" | "PRIVATE");

  // ubicación
  const mapUrl = (String(formData.get("mapUrl") || "").trim() || null) as string | null;
  const latitude = formData.get("latitude") ? Number(formData.get("latitude")) : null;
  const longitude = formData.get("longitude") ? Number(formData.get("longitude")) : null;
  if (formData.get("latitude") && Number.isNaN(latitude)) throw new Error("Latitud inválida");
  if (formData.get("longitude") && Number.isNaN(longitude)) throw new Error("Longitud inválida");

  // acompañantes
  const mpoStr = String(formData.get("maxPlusOnesPerGuest") ?? "");
  const maxPlusOnesPerGuest = mpoStr === "" ? null : Number(mpoStr);
  if (mpoStr !== "" && Number.isNaN(maxPlusOnesPerGuest)) throw new Error("Límite de acompañantes inválido");

  // NUEVO: detalles boho
  const dressCode = (String(formData.get("dressCode") || "").trim() || null) as string | null;
  const cateringCode = (String(formData.get("cateringCode") || "").trim() || null) as string | null;
  const openBar = formData.get("openBar") === "on";
  const hasGiftList = formData.get("hasGiftList") === "on";
  const askDietaryRestrictions = formData.get("askDietaryRestrictions") === "on";

  // Cronograma: acepta JSON o líneas "HH:mm | Título | (Descripción)"
  const timelineRaw = String(formData.get("timeline") || "").trim();
  let timeline: unknown = undefined;
  if (timelineRaw) {
    if (timelineRaw.startsWith("[") || timelineRaw.startsWith("{")) {
      try { timeline = JSON.parse(timelineRaw); }
      catch { throw new Error("Timeline JSON inválido"); }
    } else {
      timeline = timelineRaw
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
          const [timePart, titlePart, ...rest] = l.split("|").map((x) => x.trim());
          return { time: timePart || "", title: titlePart || "", description: rest.join(" | ") || "" };
        });
    }
  }

  if (!title || isNaN(date.getTime()) || !time || !venueName || !venueAddress) {
    throw new Error("Completa los campos requeridos.");
  }

  const slugBase = slugify(title, { lower: true, strict: true });
  let slug = slugBase; let i = 1;
  while (await prisma.event.findUnique({ where: { slug } })) slug = `${slugBase}-${i++}`;

  const event = await prisma.event.create({
    data: {
      title, date, time, venueName, venueAddress, description, slug,
      ownerId: session.user.id,
      mapUrl,
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
      maxPlusOnesPerGuest: maxPlusOnesPerGuest ?? undefined,
      dressCode,
      cateringCode,
      openBar,
      hasGiftList,
      askDietaryRestrictions,
      timeline: timeline ?? undefined,
      visibility
    },
  });

  revalidatePath("/");
  redirect(`/events/${event.slug}`);
}

function assertOwner(userId: number | undefined, eventId: number){
  if (!userId) throw new Error("No autenticado");
  return prisma.event.findUnique({ where: { id: eventId } })
  .then(ev => {
    if (!ev || ev.ownerId !== userId) throw new Error("No autorizado");
    return ev;
  });
}

export async function addGift(formData: FormData) {
  const session = await auth();
  const eventId = Number(formData.get("eventId"));
  await assertOwner(session?.user?.id, eventId);
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const price = formData.get("price") ? Number(formData.get("price")) : null;
  const storeUrl = String(formData.get("storeUrl") || "").trim() || null;
  if (!eventId || !name) throw new Error("Regalo inválido");
  await prisma.gift.create({ data: { eventId, name, description, price: price ?? undefined, storeUrl } });
  const slug = (await prisma.event.findUnique({where:{id:eventId}}))!.slug;
  revalidatePath(`/events/${slug}`);
}

export async function addGuest(formData: FormData) {
  const session = await auth();
  const eventId = Number(formData.get("eventId"));
  await assertOwner(session?.user?.id, eventId);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const plusOnes = Number(formData.get("plusOnes") || 0);
  if (!eventId || !name || !email) throw new Error("Invitado inválido");
  const ev = await prisma.event.findUnique({ where: { id: eventId } });
  const code = ev?.visibility === "PRIVATE" ? nanoId(28) : null;
  await prisma.guest.create({
    data: { eventId, name, email, plusOnes, invitationCode: code ?? undefined },
  });
}

export async function reserveGift(formData: FormData) {
  const giftId = Number(formData.get("giftId"));
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  if (!giftId || !name || !email) throw new Error("Reserva inválida");

  const gift = await prisma.gift.findUnique({ where: { id: giftId } });
  if (!gift) throw new Error("Regalo no encontrado");

  const existing = await prisma.guest.findFirst({
    where: { eventId: gift.eventId, email },
  });
  const guest =
    existing ??
    (await prisma.guest.create({
      data: { eventId: gift.eventId, name, email },
    }));

  await prisma.gift.update({
    where: { id: giftId },
    data: { reservedById: guest.id, reservedAt: new Date() },
  });
  const slug = (await prisma.event.findUnique({ where: { id: gift.eventId } }))!
    .slug;
  revalidatePath(`/events/${slug}`);
}

export async function respondRSVP(formData: FormData) {
  const code = String(formData.get("code") || "").trim() || null;
  const slug = String(formData.get("slug"));
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const status = String(formData.get("status"));
  const plusOnes = Number(formData.get("plusOnes") || 0);
  const message = String(formData.get("message") || "").trim() || null;
  const dietary = (String(formData.get("dietary") || "").trim() || null) as string | null;

  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) throw new Error("Evento no encontrado");

  let targetGuest = null as null | { id: number };
  if (code) {
    const g = await prisma.guest.findFirst({ where: { eventId: event.id, invitationCode: code } });
    if (g) targetGuest = { id: g.id };
  }

  if (targetGuest) {
    await prisma.guest.update({
      where: { id: targetGuest.id },
      data: { name, status: status as RSVPStatus, plusOnes, message, respondedAt: new Date() },
    });
  } else {
    const existing = await prisma.guest.findFirst({ where: { eventId: event.id, email } });
    if (existing) {
      await prisma.guest.update({
        where: { id: existing.id },
        data: { name, status: status as RSVPStatus, plusOnes, message, respondedAt: new Date() },
      });
    } else {
      await prisma.guest.create({
        data: { eventId: event.id, name, email, status: status as RSVPStatus, plusOnes, message, respondedAt: new Date(), dietaryRestrictions :dietary },
      });
    }
  }
  // Si el evento NO tiene lista de regalos → vuelve a la invitación.
  if (!event.hasGiftList) {
    redirect(`/events/${slug}${code ? `?code=${encodeURIComponent(code)}` : ""}`);
  }
  // Si tiene lista de regalos → Paso 2 (gifts)
  redirect(`/events/${slug}/rsvp?stage=gifts${code ? `&code=${encodeURIComponent(code)}` : ""}`);
}

export async function deleteEvent(formData: FormData) {
  const session = await auth();
  const eventId = Number(formData.get("eventId"));
  await assertOwner(session?.user?.id, eventId);
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  const slug = event!.slug;
  const gifts = await prisma.gift.findMany({ where: { eventId: eventId } });
  if (gifts.length > 0) {
    gifts.forEach( async (g) =>  await prisma.gift.delete({ where: { id: g.id } }));
  }
  const guests = await prisma.guest.findMany({ where: { eventId: eventId } });
  if (guests.length > 0) {
    guests.forEach( async (g) =>  await prisma.guest.delete({ where: { id: g.id } }));
  }
  await prisma.event.delete({ where: { id: eventId } });
  revalidatePath(`/events/${slug}`);
}

export async function deleteGuest(formData: FormData) {
  const session = await auth();
  const eventId = Number(formData.get("eventId"));
  await assertOwner(session?.user?.id, eventId);
  const guestId = Number(formData.get("guestId"));
  await prisma.guest.delete({ where: { id: guestId } });
}

export async function deleteGift(formData: FormData) {
  const session = await auth();
  const eventId = Number(formData.get("eventId"));
  await assertOwner(session?.user?.id, eventId);
  const giftId = Number(formData.get("giftId"));
  await prisma.gift.delete({ where: { id: giftId } });
}

export async function ensureInviteCode(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");

  const guestId = Number(formData.get("guestId"));
  const guest = await prisma.guest.findUnique({ where: { id: guestId }, include: { event: true } });
  if (!guest) throw new Error("Invitado no encontrado");
  if (guest.event.ownerId !== session.user.id) throw new Error("No autorizado");

  let code = guest.invitationCode;
  if (!code) {
    code = nanoId(28);
    await prisma.guest.update({ where: { id: guestId }, data: { invitationCode: code } });
  }
  // revalidate si quieres refrescar
  // revalidatePath(`/events/${guest.event.slug}`);

  // No podemos devolver valores a un <form action>. Usa la recarga visual con el código ya guardado.
}

export async function regenerateInviteCode(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");

  const guestId = Number(formData.get("guestId"));
  const guest = await prisma.guest.findUnique({ where: { id: guestId }, include: { event: true } });
  if (!guest) throw new Error("Invitado no encontrado");
  if (guest.event.ownerId !== session.user.id) throw new Error("No autorizado");

  const code = nanoId(28);
  await prisma.guest.update({ where: { id: guestId }, data: { invitationCode: code } });
  revalidatePath(`/events/${guest.event.slug}`);
}
