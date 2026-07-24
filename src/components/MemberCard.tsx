"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useLanguage } from "@/lib/language-context";
import { asset } from "@/lib/asset";

export type CardMember = {
  member_id: string;
  first_name: string;
  last_name: string;
  workplace: string | null;
  position: string | null;
  email: string | null;
  phone: string | null;
};

function buildVcard(m: CardMember): string {
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${m.first_name} ${m.last_name}`.trim(),
    m.phone ? `TEL:${m.phone}` : null,
    m.email ? `EMAIL:${m.email}` : null,
    m.workplace ? `ORG:${m.workplace}` : null,
    m.position ? `TITLE:${m.position}` : null,
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\n");
}

// Business-card proportions: 3.5in × 2in at 300dpi.
const W = 1050;
const H = 600;

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, basePx: number, weight = ""): number {
  let px = basePx;
  while (px > 14) {
    ctx.font = `${weight} ${px}px 'Noto Sans', Arial, sans-serif`.trim();
    if (ctx.measureText(text).width <= maxWidth) break;
    px -= 2;
  }
  return px;
}

/** Print-ready virtual business card with vCard QR code. */
export default function MemberCard({ member }: { member: CardMember }) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    await document.fonts.ready;

    // background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    // brand stripes
    ctx.fillStyle = "#015196";
    ctx.fillRect(0, 0, W, 14);
    ctx.fillStyle = "#c42730";
    ctx.fillRect(0, H - 14, W, 14);

    // logo
    try {
      const logo = new Image();
      logo.src = asset("/logo.png");
      await new Promise<void>((res, rej) => {
        logo.onload = () => res();
        logo.onerror = () => rej();
      });
      const lh = 130;
      const lw = (logo.width / logo.height) * lh;
      ctx.drawImage(logo, 56, 48, lw, lh);
      // association name next to logo
      ctx.fillStyle = "#015196";
      ctx.font = "bold 30px 'Noto Sans', Arial, sans-serif";
      ctx.fillText("МОНГОЛЫН ДААТГАЛЫН", 56 + lw + 24, 95);
      ctx.fillText("ЭМЧ НАРЫН ХОЛБОО", 56 + lw + 24, 135);
    } catch {
      ctx.fillStyle = "#015196";
      ctx.font = "bold 34px 'Noto Sans', Arial, sans-serif";
      ctx.fillText("МДЭНХ / MHIDA", 56, 105);
    }

    // QR code (vCard)
    const qrData = await QRCode.toDataURL(buildVcard(member), {
      width: 260,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0f2f4f", light: "#ffffff" },
    });
    const qrImg = new Image();
    qrImg.src = qrData;
    await new Promise<void>((res) => { qrImg.onload = () => res(); });
    const qrSize = 260;
    const qrX = W - qrSize - 56;
    const qrY = H - qrSize - 90;
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    ctx.fillStyle = "#64748b";
    ctx.font = "20px 'Noto Sans', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(t("Утсаараа уншуулна уу", "Scan to save contact"), qrX + qrSize / 2, qrY + qrSize + 34);
    ctx.textAlign = "left";

    // member info
    const infoX = 56;
    let y = 268;
    const name = `${member.first_name} ${member.last_name}`.trim();
    const namePx = fitText(ctx, name, qrX - infoX - 40, 52, "bold");
    ctx.fillStyle = "#0f172a";
    ctx.font = `bold ${namePx}px 'Noto Sans', Arial, sans-serif`;
    ctx.fillText(name, infoX, y);

    y += 46;
    if (member.position) {
      const px = fitText(ctx, member.position, qrX - infoX - 40, 28);
      ctx.fillStyle = "#c42730";
      ctx.font = `600 ${px}px 'Noto Sans', Arial, sans-serif`;
      ctx.fillText(member.position, infoX, y);
      y += 40;
    }
    if (member.workplace) {
      const px = fitText(ctx, member.workplace, qrX - infoX - 40, 26);
      ctx.fillStyle = "#334155";
      ctx.font = `${px}px 'Noto Sans', Arial, sans-serif`;
      ctx.fillText(member.workplace, infoX, y);
      y += 48;
    } else {
      y += 8;
    }

    ctx.fillStyle = "#334155";
    ctx.font = "26px 'Noto Sans', Arial, sans-serif";
    if (member.phone) {
      ctx.fillText(`✆ ${member.phone}`, infoX, y);
      y += 38;
    }
    if (member.email) {
      const px = fitText(ctx, `✉ ${member.email}`, qrX - infoX - 40, 26);
      ctx.font = `${px}px 'Noto Sans', Arial, sans-serif`;
      ctx.fillText(`✉ ${member.email}`, infoX, y);
      y += 38;
    }

    // member ID badge
    ctx.fillStyle = "#015196";
    const idText = member.member_id;
    ctx.font = "bold 30px 'Noto Sans', Arial, sans-serif";
    const idW = ctx.measureText(idText).width + 44;
    const idY = H - 88;
    ctx.beginPath();
    ctx.roundRect(infoX, idY, idW, 52, 26);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(idText, infoX + 22, idY + 37);

    setReady(true);
  }, [member, t]);

  useEffect(() => { void draw(); }, [draw]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `MHIDA-card-${member.member_id}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  function printCard() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(
      `<html><head><title>MHIDA ${member.member_id}</title></head>` +
      `<body style="margin:0;display:flex;justify-content:center;padding:24px;">` +
      `<img src="${dataUrl}" style="width:3.5in;height:2in;" onload="window.print()"/></body></html>`
    );
    win.document.close();
  }

  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <h3 className="mb-3 text-sm font-bold text-slate-900">
        {t("Миний нэрийн хуудас", "My Business Card")}
      </h3>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="w-full rounded-lg border border-slate-100 shadow-sm"
      />
      <div className="mt-3 flex gap-2">
        <button
          onClick={download}
          disabled={!ready}
          className="flex-1 rounded-md bg-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {t("Татах (PNG)", "Download (PNG)")}
        </button>
        <button
          onClick={printCard}
          disabled={!ready}
          className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)] disabled:opacity-50"
        >
          {t("Хэвлэх", "Print")}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {t(
          "QR кодыг уншуулахад таны нэр, утас, и-мэйл шууд хадгалагдана. Хэвлэвэл жинхэнэ нэрийн хуудасны хэмжээтэй (9х5 см).",
          "Scanning the QR saves your contact instantly. Prints at real business-card size (3.5×2 in)."
        )}
      </p>
    </div>
  );
}
