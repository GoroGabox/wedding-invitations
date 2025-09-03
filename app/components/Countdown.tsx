"use client";

import { useEffect, useMemo, useState } from "react";

export default function Countdown({ targetISO }: { targetISO: string }) {
  const target = useMemo(() => new Date(targetISO).getTime(), [targetISO]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = Math.max(0, target - now);
  const s = Math.floor(diff / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  return (
    <div className="inline-flex items-center gap-3 rounded-2xl border bg-white/70 px-4 py-2">
      <Item label="Días" value={d} />
      <Dots />
      <Item label="Horas" value={h} />
      <Dots />
      <Item label="Min" value={m} />
      <Dots />
      <Item label="Seg" value={sec} />
    </div>
  );
}

function Item({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center min-w-[3.5rem]">
      <div className="text-xl font-semibold tabular-nums">{value.toString().padStart(2, "0")}</div>
      <div className="text-[11px] uppercase tracking-wide boho-muted">{label}</div>
    </div>
  );
}
function Dots() {
  return <span className="opacity-40">·</span>;
}