"use client";

import { useState } from "react";

export default function ShareButtons({
  title,
  text,
  showCopy = false, // si quieres mostrar un botón "Copiar" aparte
}: {
  title?: string;
  text?: string;
  showCopy?: boolean;
}) {
  const [status, setStatus] = useState<"" | "copied" | "shared" | "failed">("");

  const url = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = title ?? (typeof document !== "undefined" ? document.title : "");
  const shareText = text ?? "";

  async function copyUrl(u: string) {
    // 1) Clipboard API (solo HTTPS/localhost)
    try {
      if (typeof window !== "undefined" && window.isSecureContext && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(u);
        return true;
      }
    } catch {
      // sigue
    }
    // 2) Fallback universal en HTTP: textarea + execCommand
    try {
      const ta = document.createElement("textarea");
      ta.value = u;
      ta.setAttribute("readonly", "true");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      if (ok) return true;
    } catch {
      // sigue
    }
    return false;
  }

  async function onShare() {
    // 1) Web Share API (Android/Chrome: recomendado)
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url });
        setStatus("shared");
        setTimeout(() => setStatus(""), 1500);
        return;
      } catch {
        // usuario canceló o error → sigue
      }
    }

    // 2) Intento de copia (HTTPS o fallback execCommand)
    if (await copyUrl(url)) {
      setStatus("copied");
      setTimeout(() => setStatus(""), 1500);
      return;
    }

    // 3) Fallback Android/desktop: WhatsApp o SMS
    try {
      const payload = [shareTitle, shareText, url].filter(Boolean).join(" – ");
      const wa = `https://wa.me/?text=${encodeURIComponent(payload)}`;
      window.open(wa, "_blank", "noopener");
      return;
    } catch {
      // 4) Último recurso: SMS o mailto
      const sms = `sms:?body=${encodeURIComponent([shareTitle, shareText, url].filter(Boolean).join(" – "))}`;
      try {
        window.location.href = sms;
      } catch {
        const mailto = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(
          (shareText ? shareText + "\n\n" : "") + url
        )}`;
        window.location.href = mailto;
      }
    }
  }

  async function onCopy() {
    const ok = await copyUrl(url);
    setStatus(ok ? "copied" : "failed");
    setTimeout(() => setStatus(""), 1500);
  }

  return (
    <div className="inline-flex gap-2">
      <button type="button" className="boho-outline" onClick={onShare} aria-live="polite">
        {status === "copied" ? "Enlace copiado ✓" : status === "shared" ? "Compartido ✓" : "Compartir"}
      </button>
      {showCopy && (
        <button type="button" className="boho-outline" onClick={onCopy} aria-live="polite">
          {status === "copied" ? "Copiado ✓" : "Copiar enlace"}
        </button>
      )}
    </div>
  );
}
