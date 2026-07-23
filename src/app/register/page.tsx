"use client";

import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import DraftNotice from "@/components/DraftNotice";

export default function RegisterPage() {
  const { t } = useLanguage();

  return (
    <div>
      <PageHeader eyebrow={t("Бүртгэл", "Registration")} title={t("Гишүүнээр элсэх", "Become a Member")} />

      <div className="container-page py-12">
        <DraftNotice
          note={t(
            "Бүртгэлийн маягт (Энгийн / Мэргэжлийн гишүүнчлэл), нэвтрэх эрх үүсгэх систем Phase 2-т бүтээгдэнэ.",
            "The registration form (Regular / Professional membership) and account creation flow ship in Phase 2."
          )}
        />
        <p className="mt-4 max-w-xl text-slate-600">
          {t(
            "Одоогоор гишүүнээр элсэхийг хүсвэл холбоо барих хуудсаар дамжуулан бидэнтэй холбогдоно уу.",
            "For now, please get in touch via the Contact page to register as a member."
          )}
        </p>
      </div>
    </div>
  );
}
