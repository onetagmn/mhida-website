import QRCode from "qrcode";
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

// Business-card proportions: 3.5in x 2in at 300dpi.
export const CARD_WIDTH = 1050;
export const CARD_HEIGHT = 600;

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

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, basePx: number, weight = ""): number {
  let px = basePx;
  while (px > 14) {
    ctx.font = `${weight} ${px}px 'Noto Sans', Arial, sans-serif`.trim();
    if (ctx.measureText(text).width <= maxWidth) break;
    px -= 2;
  }
  return px;
}

/**
 * Draws the MHIDA business card onto a canvas. Shared by MemberCard.tsx
 * (the dashboard's "My Business Card" widget) and the register page
 * (which draws it off-screen right after signup, to attach to the
 * welcome email via EmailJS — see register/page.tsx).
 *
 * `scanHintLabel` is passed in rather than read from useLanguage(), so
 * this function works the same whether or not it's called from inside a
 * React component with language-context available.
 */
export async function drawMemberCard(
  canvas: HTMLCanvasElement,
  member: CardMember,
  scanHintLabel: string
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = CARD_WIDTH;
  const H = CARD_HEIGHT;

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
  await new Promise<void>((res) => {
    qrImg.onload = () => res();
  });
  const qrSize = 260;
  const qrX = W - qrSize - 56;
  const qrY = H - qrSize - 90;
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
  ctx.fillStyle = "#64748b";
  ctx.font = "20px 'Noto Sans', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(scanHintLabel, qrX + qrSize / 2, qrY + qrSize + 34);
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
}
