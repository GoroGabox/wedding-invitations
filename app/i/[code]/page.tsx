import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function InviteCodePage({
  params,
}: {
  params: { code: string };
}) {
  const code = params.code;

  const guest = await prisma.guest.findFirst({
    where: { invitationCode: code },
    include: { event: true },
  });

  if (!guest || !guest.event) {
    return <div className="boho-card p-6">Invitación no válida o vencida.</div>;
  }

  // redirige a la página del evento con ?code=...
  redirect(`/events/${guest.event.slug}?code=${encodeURIComponent(code)}`);
}
