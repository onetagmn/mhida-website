"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/lib/supabase";

type Member = {
  member_id: string;
  first_name: string;
  last_name: string;
  membership: string;
  workplace: string | null;
  position: string | null;
  province: string | null;
  email: string | null;
  phone: string | null;
  is_admin?: boolean;
};

export default function DashboardPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.replace("/login/");
      return;
    }
    const { data } = await supabase
      .from("members")
      .select("member_id, first_name, last_name, membership, workplace, position, province, email, phone, is_admin")
      .eq("id", session.user.id)
      .single();
    setMember(data);
    setLoading(false);
  }, [router]);

  // Standard fetch-on-mount: state updates happen after async awaits,
  // not synchronously in the effect body.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (newPassword.length < 8) {
      setPwMsg(t("Багадаа 8 тэмдэгт.", "At least 8 characters."));
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwMsg(error
      ? t("Алдаа: ", "Error: ") + error.message
      : t("Нууц үг шинэчлэгдлээ!", "Password updated!"));
    if (!error) setNewPassword("");
  }

  if (loading) {
    return (
      <div className="container-page flex h-64 items-center justify-center text-slate-400">
        {t("Ачааллаж байна...", "Loading...")}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow={t("Гишүүний булан", "Member Area")}
        title={member ? `${member.first_name} ${member.last_name}` : t("Гишүүн", "Member")}
        subtitle={member ? `${t("Гишүүний дугаар", "Member ID")}: ${member.member_id}` : undefined}
      />

      <div className="container-page grid gap-8 py-12 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <div className="rounded-xl border border-slate-200 p-6">
            <h2 className="mb-4 text-lg font-bold text-slate-900">{t("Миний мэдээлэл", "My Profile")}</h2>
            <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-slate-500">{t("Гишүүнчлэл", "Membership")}</dt>
                <dd className="mt-0.5">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                    member?.membership === "professional"
                      ? "bg-blue-100 text-[var(--brand-blue)]"
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    {member?.membership === "professional" ? t("Мэргэжлийн", "Professional") : t("Энгийн", "Regular")}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">{t("Ажлын газар", "Workplace")}</dt>
                <dd className="mt-0.5 text-slate-800">{member?.workplace ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">{t("Албан тушаал", "Position")}</dt>
                <dd className="mt-0.5 text-slate-800">{member?.position ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">{t("Аймаг/Хот", "Province")}</dt>
                <dd className="mt-0.5 text-slate-800">{member?.province ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">{t("И-мэйл", "Email")}</dt>
                <dd className="mt-0.5 text-slate-800">{member?.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">{t("Утас", "Phone")}</dt>
                <dd className="mt-0.5 text-slate-800">{member?.phone ?? "—"}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            {t(
              "Англи хэлний курс энд удахгүй нээгдэнэ.",
              "The English course will appear here soon."
            )}
          </div>
        </div>

        <aside className="space-y-4">
          {member?.is_admin && (
            <Link
              href="/admin"
              className="block rounded-xl bg-[var(--brand-blue)] p-5 font-bold text-white transition-opacity hover:opacity-90"
            >
              {t("Админ самбар →", "Admin Panel →")}
            </Link>
          )}

          <div className="rounded-xl border border-slate-200 p-5">
            <h3 className="mb-3 text-sm font-bold text-slate-900">
              {t("Нууц үг тохируулах", "Set Password")}
            </h3>
            <p className="mb-3 text-xs text-slate-500">
              {t(
                "Дараагийн удаа кодгүйгээр нэвтрэхийн тулд нууц үг тохируулаарай.",
                "Set a password to log in without a code next time."
              )}
            </p>
            <form onSubmit={changePassword} className="space-y-2">
              <input
                type="password"
                placeholder={t("Шинэ нууц үг", "New password")}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand-blue)]"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="submit"
                className="w-full rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                {t("Хадгалах", "Save")}
              </button>
            </form>
            {pwMsg && <p className="mt-2 text-xs text-slate-600">{pwMsg}</p>}
          </div>

          <button
            onClick={logout}
            className="w-full rounded-xl border border-slate-300 p-3 text-sm font-semibold text-slate-600 transition-colors hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
          >
            {t("Гарах", "Log out")}
          </button>
        </aside>
      </div>
    </div>
  );
}
