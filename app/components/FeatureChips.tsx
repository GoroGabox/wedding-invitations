"use client";

export default function FeatureChips({
  dressCode,
  hasGiftList,
  openBar,
  cateringCode,
}: {
  dressCode?: string | null;
  hasGiftList?: boolean | null;
  openBar?: boolean | null;
  cateringCode?: string | null;
}) {
  const chips: { label: string }[] = [];

  if (dressCode) chips.push({ label: `Dress code: ${dressCode}` });
  if (hasGiftList) chips.push({ label: "Lista de regalos disponible" });
  if (openBar) chips.push({ label: "Barra libre" });
  if (cateringCode) chips.push({ label: `Cód. alimentación: ${cateringCode}` });

  if (!chips.length) return null;

  return (
    <div className="mt-4 flex flex-wrap justify-center gap-2">
      {chips.map((c, i) => (
        <span key={i} className="inline-flex items-center gap-2 rounded-full border px-3 py-1 bg-white/70 text-sm">
          {/* pequeño adorno floral */}
          <svg width="12" height="12" viewBox="0 0 24 24" className="opacity-70">
            <path fill="currentColor" d="M12 2c2.5 0 4 2 4 4s-1.5 4-4 4s-4-2-4-4s1.5-4 4-4m0 12c4 0 7 3 7 7H5c0-4 3-7 7-7Z"/>
          </svg>
          {c.label}
        </span>
      ))}
    </div>
  );
}
