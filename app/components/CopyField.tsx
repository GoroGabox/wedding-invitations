"use client";

import {  useMemo, useState } from "react";

export default function CopyField({ href }: { href: string }) {
  const [copied, setCopied] = useState(false);
  const value = useMemo(() => {
    if (!href) return "";
    try {
      // si viene ruta relativa (/i/xxxx) → absolutiza con el origin actual
      return href.startsWith("http") ? href : new URL(href, window.location.origin).href;
    } catch {
      return href;
    }
  }, [href]);

  async function copy() {
    try {
      if (window.isSecureContext && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={value}
        className="flex-1 rounded-xl border px-2 py-1 text-xs"
        style={{ width:"200px" }}
        onFocus={(e) => e.currentTarget.select()}
      />
      <button type="button" className="boho-outline" onClick={copy}>
        {copied ? "Copiado ✓" : "Copiar"}
      </button>
    </div>
  );
}
