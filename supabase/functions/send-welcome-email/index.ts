// MHIDA — welcome email, sent after a new member registers.
//
// Triggered by a Supabase Database Webhook on `members` INSERT (configure
// in Dashboard → Database → Webhooks, see supabase/functions/send-welcome-email/DEPLOY.md).
//
// What it does:
//   1. Renders the member's business card (same design as MemberCard.tsx)
//      as a PNG, server-side — logo + QR code + name/ID/contact info.
//   2. Sends a welcome email via Resend with the card attached, real login
//      instructions (login is by email, NOT by Member ID — see below), and
//      an overview of member benefits (English course + Professional
//      Courses).
//
// Card generation is the one part of this function that's genuinely new
// (server-side SVG → PNG rendering with an embedded Cyrillic font). It's
// wrapped in try/catch so that if it ever fails, the welcome email still
// sends — just without the attachment, plus a line pointing the member to
// their dashboard to get the card instead. Check function logs in the
// Supabase Dashboard if the card doesn't show up in a test email.

import { Resvg, initWasm } from "npm:@resvg/resvg-wasm@2.6.2";
import QRCode from "npm:qrcode@1.5.4";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
// Change once you've verified mhida.org as a sending domain in Resend.
// Until then, Resend's shared "onboarding@resend.dev" address works with
// no setup, but can only send to the email the Resend account owner used
// to sign up — fine for the first test, not for real members.
const RESEND_FROM = Deno.env.get("RESEND_FROM") || "MHIDA <onboarding@resend.dev>";
// Set the same value in the Database Webhook's custom headers
// (Authorization: Bearer <value>) so random requests can't trigger sends.
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");

const SITE_URL = "https://mhida.org";

let wasmReady: Promise<void> | null = null;
function ensureWasm(): Promise<void> {
  if (!wasmReady) {
    wasmReady = fetch("https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm").then((r) =>
      initWasm(r)
    );
  }
  return wasmReady;
}

const FUNCTION_DIR = new URL(".", import.meta.url);
const fontRegular = await Deno.readFile(new URL("./fonts/NotoSans-Regular.ttf", FUNCTION_DIR));
const fontBold = await Deno.readFile(new URL("./fonts/NotoSans-Bold.ttf", FUNCTION_DIR));
const logoBytes = await Deno.readFile(new URL("./logo.png", FUNCTION_DIR));
const logoBase64 = btoa(String.fromCharCode(...logoBytes));

type Member = {
  id: string;
  member_id: string;
  first_name: string;
  last_name: string;
  workplace: string | null;
  position: string | null;
  email: string;
  phone: string | null;
  membership: string;
};

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildVcard(m: Member): string {
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${m.first_name} ${m.last_name}`.trim(),
    m.phone ? `TEL:${m.phone}` : null,
    m.email ? `EMAIL:${m.email}` : null,
    m.workplace ? `ORG:${m.workplace}` : null,
    m.position ? `TITLE:${m.position}` : null,
    "END:VCARD",
  ].filter(Boolean).join("\n");
}

// Renders the member's business card as a PNG buffer. Same 1050x600
// (3.5in x 2in @300dpi) layout as MemberCard.tsx on the site.
export async function renderCardPng(member: Member): Promise<Uint8Array> {
  await ensureWasm();

  const qrDataUrl = await QRCode.toDataURL(buildVcard(member), {
    width: 260,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#0f2f4f", light: "#ffffff" },
  });

  const name = escapeXml(`${member.first_name} ${member.last_name}`.trim());
  const position = member.position ? escapeXml(member.position) : "";
  const workplace = member.workplace ? escapeXml(member.workplace) : "";
  const phone = member.phone ? escapeXml(`Утас: ${member.phone}`) : "";
  const email = escapeXml(`И-мэйл: ${member.email}`);

  const W = 1050, H = 600;
  const qrSize = 260, qrX = W - qrSize - 56, qrY = H - qrSize - 90;

  const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <rect x="0" y="0" width="${W}" height="14" fill="#015196"/>
  <rect x="0" y="${H - 14}" width="${W}" height="14" fill="#c42730"/>

  <image x="56" y="48" width="130" height="130" href="data:image/png;base64,${logoBase64}"/>
  <text x="210" y="95" font-family="Noto Sans" font-weight="700" font-size="28" fill="#015196">МОНГОЛЫН ДААТГАЛЫН</text>
  <text x="210" y="135" font-family="Noto Sans" font-weight="700" font-size="28" fill="#015196">ЭМЧ НАРЫН ХОЛБОО</text>

  <image x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" href="${qrDataUrl}"/>
  <text x="${qrX + qrSize / 2}" y="${qrY + qrSize + 30}" font-family="Noto Sans" font-size="18" fill="#64748b" text-anchor="middle">Утсаараа уншуулна уу</text>

  <text x="56" y="270" font-family="Noto Sans" font-weight="700" font-size="46" fill="#0f172a">${name}</text>
  ${position ? `<text x="56" y="312" font-family="Noto Sans" font-weight="600" font-size="26" fill="#c42730">${position}</text>` : ""}
  ${workplace ? `<text x="56" y="${position ? 348 : 312}" font-family="Noto Sans" font-size="24" fill="#334155">${workplace}</text>` : ""}

  <text x="56" y="${workplace ? 400 : 360}" font-family="Noto Sans" font-size="24" fill="#334155">${phone}</text>
  <text x="56" y="${workplace ? 434 : 394}" font-family="Noto Sans" font-size="24" fill="#334155">${email}</text>

  <rect x="56" y="${H - 88}" width="${180}" height="52" rx="26" fill="#015196"/>
  <text x="78" y="${H - 52}" font-family="Noto Sans" font-weight="700" font-size="28" fill="#ffffff">${escapeXml(member.member_id)}</text>
</svg>`.trim();

  const resvg = new Resvg(svg, {
    font: {
      fontBuffers: [fontRegular, fontBold],
      loadSystemFonts: false,
      defaultFontFamily: "Noto Sans",
    },
    background: "white",
  });
  const png = resvg.render();
  return png.asPng();
}

function base64FromBytes(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function welcomeEmailHtml(member: Member, cardAttached: boolean): string {
  const firstName = escapeXml(member.first_name);
  const memberId = escapeXml(member.member_id);
  const isProfessional = member.membership === "professional";

  return `<!DOCTYPE html>
<html lang="mn">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>MHIDA — Тавтай морил</title></head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family: 'Noto Sans', Arial, sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding: 24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; max-width:600px; width:100%;">

<tr><td style="background-color:#015196; padding: 28px 32px; text-align:center;">
<img src="${SITE_URL}/logo.png" alt="MHIDA" width="64" height="64" style="display:block; margin: 0 auto 12px auto;">
<p style="margin:0; color:#ffffff; font-size:18px; font-weight:700; letter-spacing:0.3px;">МОНГОЛЫН ДААТГАЛЫН ЭМЧ НАРЫН ХОЛБОО</p>
<p style="margin:4px 0 0 0; color:#cfe0f0; font-size:12px; letter-spacing:1px;">MONGOLIAN HEALTH INSURANCE DOCTORS ASSOCIATION</p>
</td></tr>
<tr><td style="background-color:#c42730; height:4px; line-height:4px; font-size:0;">&nbsp;</td></tr>

<tr><td style="padding: 32px 32px 8px 32px;">
<p style="margin:0; font-size:22px; font-weight:700; color:#0f172a;">Сайн байна уу, ${firstName}!</p>
<p style="margin:6px 0 0 0; font-size:14px; color:#64748b;">Hello, ${firstName}!</p>
</td></tr>

<tr><td style="padding: 12px 32px 0 32px;">
<p style="margin:0; font-size:15px; line-height:1.6; color:#334155;">Таны МДЭНХ-ийн гишүүнчлэлийн бүртгэл амжилттай баталгаажлаа. Тавтай морилно уу!</p>
<p style="margin:6px 0 0 0; font-size:13px; line-height:1.5; color:#94a3b8; font-style:italic;">Your MHIDA membership registration is confirmed. Welcome!</p>
</td></tr>

<tr><td style="padding: 24px 32px 0 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eff6ff; border:1px solid #bfdbfe; border-radius:10px;">
<tr><td style="padding: 18px 20px; text-align:center;">
<p style="margin:0; font-size:12px; font-weight:700; letter-spacing:1px; color:#015196; text-transform:uppercase;">Таны гишүүний дугаар / Your Member ID</p>
<p style="margin:6px 0 0 0; font-size:28px; font-weight:800; color:#015196; letter-spacing:1px;">${memberId}</p>
</td></tr>
</table>
</td></tr>

${cardAttached ? `
<tr><td style="padding: 24px 32px 0 32px; text-align:center;">
<p style="margin:0 0 12px 0; font-size:13px; color:#64748b;">Таны цахим нэрийн хуудас — хэвлэж эсвэл утсандаа хадгалж болно.</p>
<img src="cid:member-card.png" alt="MHIDA Member Card ${memberId}" width="460" style="display:block; margin:0 auto; border-radius:10px; border:1px solid #e2e8f0; max-width:100%; height:auto;">
<p style="margin:10px 0 0 0; font-size:12px; color:#94a3b8; font-style:italic;">Your digital business card — attached as an image, print it or save it to your phone.</p>
</td></tr>` : `
<tr><td style="padding: 24px 32px 0 32px; text-align:center;">
<p style="margin:0; font-size:13px; color:#64748b;">Нэрийн хуудсаа өөрийн булангаас үзэж, татаж авна уу:</p>
<p style="margin:8px 0 0 0;"><a href="${SITE_URL}/dashboard" style="color:#015196; font-weight:700; text-decoration:none;">mhida.org/dashboard →</a></p>
<p style="margin:6px 0 0 0; font-size:12px; color:#94a3b8; font-style:italic;">View and download your card from your dashboard.</p>
</td></tr>`}

<tr><td style="padding: 28px 32px 0 32px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #e2e8f0; font-size:0; line-height:0;">&nbsp;</td></tr></table></td></tr>

<tr><td style="padding: 24px 32px 0 32px;">
<p style="margin:0; font-size:17px; font-weight:700; color:#0f172a;">🔑 Системд хэрхэн нэвтрэх вэ?</p>
<p style="margin:2px 0 14px 0; font-size:12px; color:#94a3b8; font-style:italic;">How to log in to your account</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td width="28" valign="top" style="padding: 0 10px 14px 0;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="24" height="24" style="background-color:#015196; border-radius:50%; text-align:center; color:#ffffff; font-size:12px; font-weight:700; line-height:24px;">1</td></tr></table></td>
<td style="padding: 0 0 14px 0; font-size:14px; line-height:1.55; color:#334155;">
<b>mhida.org</b> сайт руу орж, баруун дээд буланд байрлах <b>«Нэвтрэх»</b> товч дээр дарна уу.<br>
<span style="color:#94a3b8; font-size:12px; font-style:italic;">Go to mhida.org and click "Log in" in the top-right corner.</span>
</td></tr>
<tr>
<td width="28" valign="top" style="padding: 0 10px 14px 0;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="24" height="24" style="background-color:#015196; border-radius:50%; text-align:center; color:#ffffff; font-size:12px; font-weight:700; line-height:24px;">2</td></tr></table></td>
<td style="padding: 0 0 14px 0; font-size:14px; line-height:1.55; color:#334155;">
Бүртгүүлсэн <b>и-мэйл хаягаа</b> оруулаад, "Нэг удаагийн код авах" сонголтыг дарна уу — 6 оронтой код и-мэйл хаяг руу тань очно.<br>
<span style="color:#94a3b8; font-size:12px; font-style:italic;">Enter the email address you registered with and choose "Get a login code" — a 6-digit code will be sent to your email.</span>
</td></tr>
<tr>
<td width="28" valign="top" style="padding: 0 10px 14px 0;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="24" height="24" style="background-color:#015196; border-radius:50%; text-align:center; color:#ffffff; font-size:12px; font-weight:700; line-height:24px;">3</td></tr></table></td>
<td style="padding: 0 0 14px 0; font-size:14px; line-height:1.55; color:#334155;">
Нэвтэрсний дараа профайл хуудаснаасаа <b>байнгын нууц үг</b> тохируулаарай — дараагийн удаа кодгүйгээр шууд нэвтэрнэ.<br>
<span style="color:#94a3b8; font-size:12px; font-style:italic;">Once logged in, set a permanent password on your profile page — next time you can log in directly, no code needed.</span>
</td></tr>
</table>
<p style="margin:4px 0 0 0; font-size:12px; line-height:1.5; color:#94a3b8; background-color:#f8fafc; border-radius:8px; padding:10px 14px;">
💡 <b>Гишүүний дугаар (${memberId})</b> нь таны албан ёсны таних дугаар — нэвтрэхэд <b>ашиглагдахгүй</b>. Нэвтрэхдээ и-мэйл хаягаа ашиглана.<br>
<span style="font-style:italic;">Your Member ID (${memberId}) is your official identifier — it is <b>not</b> used to log in. Logging in uses your email address.</span>
</p>
</td></tr>

<tr><td style="padding: 24px 32px 0 32px; text-align:center;">
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
<tr><td style="background-color:#c42730; border-radius:8px;"><a href="${SITE_URL}/login" style="display:inline-block; padding: 13px 32px; font-size:15px; font-weight:700; color:#ffffff; text-decoration:none;">Нэвтрэх → Log In</a></td></tr>
</table>
</td></tr>

<tr><td style="padding: 28px 32px 0 32px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #e2e8f0; font-size:0; line-height:0;">&nbsp;</td></tr></table></td></tr>

<tr><td style="padding: 24px 32px 0 32px;">
<p style="margin:0; font-size:17px; font-weight:700; color:#0f172a;">🎓 Гишүүнчлэлийн үнэ цэнэ — Сургалтууд</p>
<p style="margin:2px 0 14px 0; font-size:12px; color:#94a3b8; font-style:italic;">Your membership benefits — training courses</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; border-radius:10px; margin-bottom:14px;">
<tr><td style="padding: 16px 18px;">
<p style="margin:0; font-size:14px; font-weight:700; color:#015196;">Open Frequency English — 30 долоо хоногийн курс</p>
<p style="margin:6px 0 0 0; font-size:13px; line-height:1.55; color:#334155;">Видео хичээл, сонсож-давтах дадлага, ярианы дасгал, дуудлагын анхаарал, өөрийгөө бичиж сонсох боломжтой — бүх гишүүнд <b>үнэ төлбөргүй</b>. Дуусгасны дараа албан ёсны гэрчилгээ авна.</p>
<p style="margin:8px 0 0 0; font-size:12px; line-height:1.5; color:#94a3b8; font-style:italic;">Video lessons, listen-and-repeat practice, speaking drills, pronunciation focus, and self-recording — free for every member. Earn an official certificate on completion.</p>
</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; border-radius:10px;">
<tr><td style="padding: 16px 18px;">
<p style="margin:0; font-size:14px; font-weight:700; color:#015196;">Мэргэжлийн сургалтууд — Johns Hopkins, Yale, Duke, ДЭМБ гэх мэт</p>
<p style="margin:6px 0 0 0; font-size:13px; line-height:1.55; color:#334155;">Дэлхийн шилдэг их сургуулиудын 10 үнэгүй видео курс: эмнэлгийн код, өвчтөний аюулгүй байдал, эрүүл мэндийн эдийн засаг, тархвар судлал зэрэг. <b>Мэргэжлийн гишүүдэд</b> 9 курс нээлттэй; 1 нь (ДЭМБ) бүх гишүүнд үнэгүй.</p>
<p style="margin:8px 0 0 0; font-size:12px; line-height:1.5; color:#94a3b8; font-style:italic;">10 free video courses from top universities — medical coding, patient safety, health economics, epidemiology, and more. 9 courses are for Professional members; 1 (WHO) is open to everyone.</p>
</td></tr></table>
</td></tr>

<tr><td style="padding: 18px 32px 0 32px;">
${isProfessional ? `
<p style="margin:0; font-size:13px; line-height:1.6; color:#334155;">Та <b>Мэргэжлийн гишүүн</b> тул бүх 10 сургалт танд нээлттэй байна.</p>
<p style="margin:4px 0 0 0; font-size:12px; color:#94a3b8; font-style:italic;">As a Professional member, all 10 courses are already unlocked for you.</p>` : `
<p style="margin:0; font-size:13px; line-height:1.6; color:#334155;">Одоогоор та <b>Энгийн гишүүн</b> — Мэргэжлийн гишүүнчлэлд шилжиж бүх сургалт болон нэмэлт эрхийг нээж болно. Дэлгэрэнгүйг өөрийн булангаас үзнэ үү.</p>
<p style="margin:4px 0 0 0; font-size:12px; color:#94a3b8; font-style:italic;">You're currently a Regular member — upgrade to Professional to unlock every course and additional benefits, from your member dashboard.</p>`}
</td></tr>

<tr><td style="padding: 32px 32px 32px 32px; text-align:center;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #e2e8f0; font-size:0; line-height:0; padding-bottom:20px;">&nbsp;</td></tr></table>
<p style="margin:0; font-size:12px; color:#94a3b8;">Монголын Даатгалын Эмч Нарын Холбоо · MHIDA</p>
<p style="margin:6px 0 0 0; font-size:12px; color:#94a3b8;">☏ 9997 8179 · 9985 4040 &nbsp;·&nbsp; <a href="${SITE_URL}" style="color:#015196; text-decoration:none;">mhida.org</a></p>
<p style="margin:14px 0 0 0; font-size:11px; color:#cbd5e1;">Та энэ и-мэйлийг МДЭНХ-д бүртгүүлсэн тул хүлээн авч байна.</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (WEBHOOK_SECRET) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${WEBHOOK_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set");
    return new Response("Server not configured", { status: 500 });
  }

  let payload: { type?: string; table?: string; record?: Member };
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (payload.table !== "members" || payload.type !== "INSERT" || !payload.record) {
    // Not a new-member insert — acknowledge and ignore.
    return new Response("Ignored", { status: 200 });
  }

  const member = payload.record;
  if (!member.email) {
    return new Response("Member has no email", { status: 200 });
  }

  let cardPng: Uint8Array | null = null;
  try {
    cardPng = await renderCardPng(member);
  } catch (err) {
    console.error("Card generation failed, sending email without attachment:", err);
  }

  const html = welcomeEmailHtml(member, cardPng !== null);

  const body: Record<string, unknown> = {
    from: RESEND_FROM,
    to: [member.email],
    subject: `Тавтай морил / Welcome to MHIDA — ${member.member_id}`,
    html,
  };
  if (cardPng) {
    body.attachments = [
      {
        filename: `MHIDA-card-${member.member_id}.png`,
        content: base64FromBytes(cardPng),
        content_id: "member-card.png",
      },
    ];
  }

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!resendRes.ok) {
    const errText = await resendRes.text();
    console.error("Resend send failed:", resendRes.status, errText);
    return new Response(`Resend error: ${errText}`, { status: 502 });
  }

  return new Response("OK", { status: 200 });
});
