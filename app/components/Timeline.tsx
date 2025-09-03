"use client";

export type TimelineItem = { time?: string; title: string; description?: string };

export default function Timeline({ items }: { items: TimelineItem[] }) {
  if (!items?.length) return null;

  return (
    <ol className="relative ml-3 border-s-2 border-[color:rgba(195,107,94,.35)]">
      {items.map((it, idx) => (
        <li key={idx} className="mb-6 ms-4">
          <div className="absolute -start-2.5 mt-1 h-5 w-5 rounded-full border-2 border-white bg-[color:#C36B5E] shadow" />
          <div className="flex flex-wrap items-center gap-2">
            {it.time && (
              <span className="rounded-full border px-2 py-0.5 text-xs bg-white/70">
                {it.time}
              </span>
            )}
            <h3 className="font-semibold">{it.title}</h3>
          </div>
          {it.description && (
            <p className="mt-1 text-sm boho-muted">{it.description}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
