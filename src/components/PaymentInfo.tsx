"use client";

import { useLanguage } from "@/lib/language-context";
import { asset } from "@/lib/asset";
import { PAYMENT } from "@/lib/payment";

/** Bank transfer details for the professional membership fee. */
export default function PaymentInfo({ memberId }: { memberId?: string | null }) {
  const { t } = useLanguage();

  return (
    <div>
      <dl className="space-y-1.5 rounded-xl bg-white p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">{t("Банк", "Bank")}</dt>
          <dd className="text-right font-semibold text-slate-800">{t(PAYMENT.bankMn, PAYMENT.bankEn)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">{t("Хүлээн авагч", "Recipient")}</dt>
          <dd className="text-right font-semibold text-slate-800">{t(PAYMENT.recipientMn, PAYMENT.recipientEn)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">{t("Данс", "Account")}</dt>
          <dd className="break-all text-right font-mono font-semibold text-slate-800">{PAYMENT.account}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">{t("Гүйлгээний утга", "Description")}</dt>
          <dd className="font-bold text-[var(--brand-red)]">{memberId ?? "MD###"}</dd>
        </div>
      </dl>
      {PAYMENT.hasQr && (
        <div className="mt-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset("/qpay-qr.png")}
            alt="QPay QR"
            className="mx-auto h-44 w-44 rounded-lg border border-slate-200 object-contain"
          />
          <p className="mt-1 text-xs text-slate-500">
            {t("Банкны аппаараа уншуулна уу", "Scan with your banking app")}
          </p>
        </div>
      )}
      <p className="mt-3 text-xs text-slate-500">
        {t(
          "Гүйлгээний утга дээр гишүүний дугаараа заавал бичнэ үү.",
          "Please include your member ID in the transfer description."
        )}
      </p>
    </div>
  );
}
