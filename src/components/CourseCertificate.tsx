"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";

// A4 landscape at ~150dpi
const W = 1754;
const H = 1240;

/** Completion certificate for the English course — canvas-rendered, downloadable. */
export default function CourseCertificate({ name, lang }: { name: string; lang: "mn" | "en" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    await document.fonts.ready;

    // background + border
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#015196";
    ctx.lineWidth = 10;
    ctx.strokeRect(40, 40, W - 80, H - 80);
    ctx.strokeStyle = "#c42730";
    ctx.lineWidth = 3;
    ctx.strokeRect(60, 60, W - 120, H - 120);

    // logo
    try {
      const logo = new Image();
      logo.src = asset("/logo.png");
      await new Promise<void>((res, rej) => { logo.onload = () => res(); logo.onerror = () => rej(); });
      const lh = 170;
      const lw = (logo.width / logo.height) * lh;
      ctx.drawImage(logo, W / 2 - lw / 2, 100, lw, lh);
    } catch { /* logo optional */ }

    ctx.textAlign = "center";

    ctx.fillStyle = "#015196";
    ctx.font = "bold 64px 'Noto Sans', Arial, sans-serif";
    ctx.fillText(lang === "mn" ? "ГЭРЧИЛГЭЭ" : "CERTIFICATE", W / 2, 380);
    ctx.font = "28px 'Noto Sans', Arial, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText(lang === "mn" ? "Төгсөлтийн гэрчилгээ" : "Certificate of Completion", W / 2, 425);

    ctx.fillStyle = "#334155";
    ctx.font = "26px 'Noto Sans', Arial, sans-serif";
    ctx.fillText(lang === "mn" ? "Энэхүү гэрчилгээг" : "This certificate is proudly presented to", W / 2, 520);

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 72px 'Noto Sans', Arial, sans-serif";
    ctx.fillText(name || "—", W / 2, 620);
    // underline
    const nw = ctx.measureText(name || "—").width;
    ctx.strokeStyle = "#c42730";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W / 2 - nw / 2 - 30, 645);
    ctx.lineTo(W / 2 + nw / 2 + 30, 645);
    ctx.stroke();

    ctx.fillStyle = "#334155";
    ctx.font = "26px 'Noto Sans', Arial, sans-serif";
    ctx.fillText(
      lang === "mn"
        ? "«Open Frequency English» — Ярианы англи хэлний 30 долоо хоногийн курсыг"
        : "for successfully completing the 30-week spoken English course",
      W / 2, 720
    );
    ctx.fillText(
      lang === "mn"
        ? "амжилттай төгссөнийг гэрчилж олгов. (CEFR A1 түвшин)"
        : "“Open Frequency English” (CEFR Level A1)",
      W / 2, 762
    );

    const today = new Date();
    const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;
    ctx.font = "24px 'Noto Sans', Arial, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText(`${lang === "mn" ? "Огноо" : "Date"}: ${dateStr}`, W / 2, 860);

    // signature blocks
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(280, 1030); ctx.lineTo(660, 1030); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W - 660, 1030); ctx.lineTo(W - 280, 1030); ctx.stroke();
    ctx.fillStyle = "#64748b";
    ctx.font = "22px 'Noto Sans', Arial, sans-serif";
    ctx.fillText(lang === "mn" ? "МДЭНХ-ийн Тэргүүн" : "President, MHIDA", 470, 1065);
    ctx.fillText(lang === "mn" ? "Хөтөлбөрийн захирал" : "Program Director", W - 470, 1065);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "20px 'Noto Sans', Arial, sans-serif";
    ctx.fillText("Монголын Даатгалын Эмч Нарын Холбоо · mhida.org", W / 2, 1150);

    ctx.textAlign = "left";
    setReady(true);
  }, [name, lang]);

  useEffect(() => { void draw(); }, [draw]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "MHIDA-English-Certificate.png";
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  return (
    <div className="rounded-2xl border-2 border-green-200 bg-green-50/50 p-6 text-center">
      <p className="text-3xl">🎓</p>
      <h2 className="mt-2 text-xl font-bold text-slate-900">
        {lang === "mn" ? "Баяр хүргэе — курс төгслөө!" : "Congratulations — course complete!"}
      </h2>
      <canvas ref={canvasRef} width={W} height={H} className="mx-auto mt-4 w-full max-w-xl rounded-lg border border-slate-200 shadow-sm" />
      <button
        onClick={download}
        disabled={!ready}
        className="mt-4 rounded-md bg-[var(--brand-blue)] px-8 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {lang === "mn" ? "Гэрчилгээ татах (PNG)" : "Download Certificate (PNG)"}
      </button>
    </div>
  );
}
