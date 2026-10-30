"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { drawMemberCard, CARD_WIDTH, CARD_HEIGHT, type CardMember } from "@/lib/memberCardCanvas";

export type { CardMember };

/** Print-ready virtual business card with vCard QR code. */
export default function MemberCard({ member }: { member: CardMember }) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    await drawMemberCard(canvas, member, t("Утсаараа уншуулна уу", "Scan to save contact"));
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
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
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
