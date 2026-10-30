"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";

// A4 landscape at ~150dpi
const W = 1754;
const H = 1240;

export type CertificateCourseText = {
  /** e.g. "«Frequency English» — Ярианы англи хэлний 30 өдрийн курсыг" */
  line1Mn: string;
  /** e.g. "for successfully completing the 30-day spoken English course" */
  line1En: string;
  /** e.g. "амжилттай төгссөнийг гэрчилж олгов. (CEFR A1–B1 түвшин)" */
  line2Mn: string;
  /** e.g. "“Frequency English” (CEFR Level A1–B1)" */
  line2En: string;
};

const DEFAULT_COURSE: CertificateCourseText = {
  line1Mn: "«Open Frequency English» — Ярианы англи хэлний 30 өдрийн курсыг",
  line1En: "for successfully completing the 30-day spoken English course",
  line2Mn: "амжилттай төгссөнийг гэрчилж олгов. (CEFR A1–B1 түвшин)",
  line2En: "“Open Frequency English” (CEFR Level A1–B1)",
};

/**
 * Completion certificate — canvas-rendered, downloadable, printable.
 * Reusable across courses: pass `course` with that course's own wording;
 * everything else (layout, signatures, stamp, watermark) stays identical
 * so every MHIDA course certificate looks the same aside from the name
 * and the two description lines.
 */
export default function CourseCertificate({
  name, lang, compact = false, course = DEFAULT_COURSE,
}: { name: string; lang: "mn" | "en"; compact?: boolean; course?: CertificateCourseText }) {
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

    // faint grayscale logo watermark, centered behind everything
    try {
      const wm = new Image();
      wm.src = asset("/logo-watermark.png");
      await new Promise<void>((res, rej) => { wm.onload = () => res(); wm.onerror = () => rej(); });
      ctx.save();
      ctx.globalAlpha = 0.05;
      ctx.filter = "grayscale(1)";
      const wmSize = 820;
      ctx.drawImage(wm, W / 2 - wmSize / 2, H / 2 - wmSize / 2, wmSize, wmSize);
      ctx.restore();
      ctx.filter = "none";
    } catch { /* watermark optional */ }

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
    ctx.fillText(lang === "mn" ? course.line1Mn : course.line1En, W / 2, 720);
    ctx.fillText(lang === "mn" ? course.line2Mn : course.line2En, W / 2, 762);

    const today = new Date();
    const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;
    ctx.font = "24px 'Noto Sans', Arial, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText(`${lang === "mn" ? "Огноо" : "Date"}: ${dateStr}`, W / 2, 860);

    // signature blocks
    // Handwritten signature, crossing the line above the President's name.
    try {
      const sig = new Image();
      sig.src = asset("/cert-signature.png");
      await new Promise<void>((res, rej) => { sig.onload = () => res(); sig.onerror = () => rej(); });
      const sh = 180;
      const sw = (sig.width / sig.height) * sh;
      ctx.drawImage(sig, 460 - sw / 2, 950 - sh / 2, sw, sh);
    } catch { /* signature optional */ }

    // Handwritten signature for the Program Director.
    try {
      const sig2 = new Image();
      sig2.src = asset("/cert-signature-2.png");
      await new Promise<void>((res, rej) => { sig2.onload = () => res(); sig2.onerror = () => rej(); });
      const sh2 = 110;
      const sw2 = (sig2.width / sig2.height) * sh2;
      ctx.drawImage(sig2, W - 470 - sw2 / 2, 975 - sh2 / 2, sw2, sh2);
    } catch { /* signature optional */ }

    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(280, 1030); ctx.lineTo(660, 1030); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W - 660, 1030); ctx.lineTo(W - 280, 1030); ctx.stroke();

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 26px 'Noto Sans', Arial, sans-serif";
    ctx.fillText("Б. Очирбат", 470, 1063);
    ctx.fillText("Л. Уянга", W - 470, 1063);

    ctx.fillStyle = "#64748b";
    ctx.font = "22px 'Noto Sans', Arial, sans-serif";
    ctx.fillText(lang === "mn" ? "МДЭНХ-ийн Ерөнхийлөгч" : "President, MHIDA", 470, 1093);
    ctx.fillText(lang === "mn" ? "Хөтөлбөрийн захирал" : "Program Director", W - 470, 1093);

    // Official stamp, overlapping the President's signature.
    try {
      const stamp = new Image();
      stamp.src = asset("/cert-stamp.png");
      await new Promise<void>((res, rej) => { stamp.onload = () => res(); stamp.onerror = () => rej(); });
      const stampSize = 210;
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.translate(565, 950);
      ctx.rotate((-8 * Math.PI) / 180);
      ctx.drawImage(stamp, -stampSize / 2, -stampSize / 2, stampSize, stampSize);
      ctx.restore();
    } catch { /* stamp optional */ }

    ctx.fillStyle = "#94a3b8";
    ctx.font = "20px 'Noto Sans', Arial, sans-serif";
    ctx.fillText("Монголын Даатгалын Эмч Нарын Холбоо · mhida.org", W / 2, 1150);

    ctx.textAlign = "left";
    setReady(true);
  }, [name, lang, course]);

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

  function print() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(
      `<html><head><title>MHIDA Certificate</title></head>` +
      `<body style="margin:0;display:flex;justify-content:center;padding:24px;">` +
      `<img src="${dataUrl}" style="width:11.7in;height:8.3in;" onload="window.print()"/></body></html>`
    );
    win.document.close();
  }

  if (compact) {
    return (
      <div className="rounded-xl border border-slate-200 p-5">
        <h3 className="mb-3 text-sm font-bold text-slate-900">
          🎓 {lang === "mn" ? "Миний гэрчилгээ" : "My Certificate"}
        </h3>
        <canvas ref={canvasRef} width={W} height={H} className="w-full rounded-lg border border-slate-100 shadow-sm" />
        <div className="mt-3 flex gap-2">
          <button
            onClick={download}
            disabled={!ready}
            className="flex-1 rounded-md bg-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {lang === "mn" ? "Татах (PNG)" : "Download (PNG)"}
          </button>
          <button
            onClick={print}
            disabled={!ready}
            className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)] disabled:opacity-50"
          >
            {lang === "mn" ? "Хэвлэх" : "Print"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-green-200 bg-green-50/50 p-6 text-center">
      <p className="text-3xl">🎓</p>
      <h2 className="mt-2 text-xl font-bold text-slate-900">
        {lang === "mn" ? "Баяр хүргэе — курс төгслөө!" : "Congratulations — course complete!"}
      </h2>
      <canvas ref={canvasRef} width={W} height={H} className="mx-auto mt-4 w-full max-w-xl rounded-lg border border-slate-200 shadow-sm" />
      <div className="mt-4 flex justify-center gap-3">
        <button
          onClick={download}
          disabled={!ready}
          className="rounded-md bg-[var(--brand-blue)] px-8 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {lang === "mn" ? "Гэрчилгээ татах (PNG)" : "Download Certificate (PNG)"}
        </button>
        <button
          onClick={print}
          disabled={!ready}
          className="rounded-md border border-slate-300 px-8 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)] disabled:opacity-50"
        >
          {lang === "mn" ? "Хэвлэх" : "Print"}
        </button>
      </div>
    </div>
  );
}
