"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/lib/supabase";
import CourseCertificate from "@/components/CourseCertificate";

type QuizQ = { q: string; options: string[]; answer: number };
type LessonContent = {
  objectives: string[];
  dialogue: { speaker: string; en: string; mn: string }[];
  vocab: { en: string; mn: string; example: string }[];
  grammar: { title: string; body: string; examples: string[] };
  speaking: string[];
  quiz: QuizQ[];
};
type Lesson = {
  id: string;
  week: number;
  title: string;
  title_mn: string;
  video_url: string | null;
  content: LessonContent;
};
type Progress = { lesson_id: string; completed: boolean; quiz_score: number | null; quiz_total: number | null };

export default function EnglishCoursePage() {
  const { t, lang } = useLanguage();
  const [authState, setAuthState] = useState<"loading" | "out" | "in">("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [memberName, setMemberName] = useState("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [openLesson, setOpenLesson] = useState<Lesson | null>(null);

  // quiz state for the open lesson
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; total: number } | null>(null);
  const [showMn, setShowMn] = useState(true);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setAuthState("out"); return; }
    setUserId(session.user.id);
    const [lessonsRes, progressRes, meRes] = await Promise.all([
      supabase.from("course_lessons").select("id, week, title, title_mn, video_url, content").order("week"),
      supabase.from("course_progress").select("lesson_id, completed, quiz_score, quiz_total"),
      supabase.from("members").select("first_name, last_name").eq("id", session.user.id).single(),
    ]);
    setLessons((lessonsRes.data as Lesson[]) ?? []);
    const p: Record<string, Progress> = {};
    for (const row of (progressRes.data as Progress[]) ?? []) p[row.lesson_id] = row;
    setProgress(p);
    if (meRes.data) setMemberName(`${meRes.data.first_name} ${meRes.data.last_name}`.trim());
    setAuthState("in");
  }, []);

  // Standard fetch-on-mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  const doneCount = useMemo(
    () => lessons.filter((l) => progress[l.id]?.completed).length,
    [lessons, progress]
  );
  const allDone = lessons.length > 0 && doneCount === lessons.length;
  const nextLesson = lessons.find((l) => !progress[l.id]?.completed) ?? null;

  function openWeek(l: Lesson) {
    setOpenLesson(l);
    setAnswers({});
    const p = progress[l.id];
    setQuizResult(p?.quiz_score != null && p?.quiz_total != null ? { score: p.quiz_score, total: p.quiz_total } : null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitQuiz() {
    if (!openLesson || !userId) return;
    const quiz = openLesson.content.quiz;
    let score = 0;
    quiz.forEach((q, i) => { if (answers[i] === q.answer) score++; });
    const result = { score, total: quiz.length };
    setQuizResult(result);
    const passed = score >= Math.ceil(quiz.length * 0.6);
    await supabase.from("course_progress").upsert({
      member_id: userId,
      lesson_id: openLesson.id,
      quiz_score: score,
      quiz_total: quiz.length,
      completed: passed,
      completed_at: passed ? new Date().toISOString() : null,
    });
    setProgress((p) => ({
      ...p,
      [openLesson.id]: { lesson_id: openLesson.id, completed: passed, quiz_score: score, quiz_total: quiz.length },
    }));
  }

  /* ---------- render states ---------- */

  if (authState === "loading") {
    return <div className="container-page flex h-64 items-center justify-center text-slate-400">{t("Ачааллаж байна...", "Loading...")}</div>;
  }

  if (authState === "out") {
    return (
      <div>
        <PageHeader
          eyebrow={t("Сургалт", "Training")}
          title={t("Англи хэлний курс", "English Course")}
          subtitle="Open Frequency English — 10-Week Speaking Course (CEFR A1)"
        />
        <div className="container-page py-16">
          <div className="mx-auto max-w-md rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
            <p className="text-4xl">🔒</p>
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              {t("Зөвхөн гишүүдэд", "Members Only")}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {t(
                "Энэ курс МДЭНХ-ийн гишүүдэд үнэгүй. Хичээл үзэх, ахицаа хадгалах, гэрчилгээ авахын тулд нэвтэрнэ үү.",
                "This course is free for MHIDA members. Log in to study, save your progress, and earn your certificate."
              )}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/login" className="rounded-md bg-[var(--brand-blue)] px-6 py-2.5 text-sm font-bold text-white hover:opacity-90">
                {t("Нэвтрэх", "Log in")}
              </Link>
              <Link href="/register" className="rounded-md border border-[var(--brand-red)] px-6 py-2.5 text-sm font-bold text-[var(--brand-red)] hover:bg-red-50">
                {t("Бүртгүүлэх", "Register")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- lesson view ---------- */

  if (openLesson) {
    const c = openLesson.content;
    const p = progress[openLesson.id];
    return (
      <div>
        <PageHeader
          eyebrow={`${t("7 хоног", "Week")} ${openLesson.week} / 10`}
          title={openLesson.title}
          subtitle={openLesson.title_mn}
        />
        <div className="container-page py-10">
          <div className="mx-auto max-w-3xl space-y-10">
            <div className="flex items-center justify-between">
              <button onClick={() => setOpenLesson(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]">
                {t("← Бүх хичээл", "← All lessons")}
              </button>
              <button
                onClick={() => setShowMn((v) => !v)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]"
              >
                {showMn ? t("Орчуулга нуух", "Hide translations") : t("Орчуулга харах", "Show translations")}
              </button>
            </div>

            {/* Objectives */}
            <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-6">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--brand-blue)]">
                {t("Зорилго", "Objectives")}
              </h2>
              <ul className="space-y-1.5 text-sm text-slate-700">
                {c.objectives.map((o, i) => (
                  <li key={i} className="flex gap-2"><span className="text-[var(--brand-blue)]">✓</span>{o}</li>
                ))}
              </ul>
            </section>

            {/* Video (optional) */}
            {openLesson.video_url && (
              <section>
                <h2 className="mb-3 text-lg font-bold text-slate-900">{t("Видео хичээл", "Video Lesson")}</h2>
                <div className="overflow-hidden rounded-xl">
                  <iframe
                    src={openLesson.video_url.replace("watch?v=", "embed/")}
                    className="aspect-video w-full"
                    allowFullScreen
                    title="Lesson video"
                  />
                </div>
              </section>
            )}

            {/* Dialogue */}
            <section>
              <h2 className="mb-4 text-lg font-bold text-slate-900">{t("Яриа", "Dialogue")}</h2>
              <div className="space-y-3">
                {c.dialogue.map((d, i) => (
                  <div key={i} className={`max-w-[85%] rounded-2xl border p-4 ${i % 2 === 0 ? "border-blue-100 bg-blue-50/50" : "ml-auto border-slate-200 bg-slate-50"}`}>
                    <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">{d.speaker}</p>
                    <p className="font-medium text-slate-900">{d.en}</p>
                    {showMn && <p className="mt-1 text-sm text-slate-500">{d.mn}</p>}
                  </div>
                ))}
              </div>
            </section>

            {/* Vocabulary */}
            <section>
              <h2 className="mb-4 text-lg font-bold text-slate-900">{t("Шинэ үгс", "Vocabulary")}</h2>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    {c.vocab.map((v, i) => (
                      <tr key={i} className={i % 2 ? "bg-slate-50" : ""}>
                        <td className="px-4 py-2.5 font-semibold text-slate-900">{v.en}</td>
                        {showMn && <td className="px-4 py-2.5 text-slate-600">{v.mn}</td>}
                        <td className="px-4 py-2.5 italic text-slate-500">{v.example}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Grammar */}
            <section className="rounded-2xl border border-slate-200 p-6">
              <h2 className="mb-2 text-lg font-bold text-slate-900">📘 {c.grammar.title}</h2>
              <p className="text-sm text-slate-600">{c.grammar.body}</p>
              <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
                {c.grammar.examples.map((e, i) => (
                  <li key={i} className="rounded-md bg-slate-50 px-3 py-2 font-medium">{e}</li>
                ))}
              </ul>
            </section>

            {/* Speaking practice */}
            <section className="rounded-2xl border border-red-100 bg-red-50/40 p-6">
              <h2 className="mb-3 text-lg font-bold text-slate-900">🗣 {t("Ярианы дадлага", "Speaking Practice")}</h2>
              <ol className="space-y-2 text-sm text-slate-700">
                {c.speaking.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand-red)] text-xs font-bold text-white">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </section>

            {/* Quiz */}
            <section className="rounded-2xl border border-slate-200 p-6">
              <h2 className="mb-1 text-lg font-bold text-slate-900">📝 {t("Шалгалт", "Quiz")}</h2>
              <p className="mb-5 text-xs text-slate-500">
                {t("60%-иас дээш оноо авбал хичээл дуусна.", "Score 60% or higher to complete the lesson.")}
                {p?.quiz_score != null && ` · ${t("Өмнөх оноо", "Previous score")}: ${p.quiz_score}/${p.quiz_total}`}
              </p>
              <div className="space-y-6">
                {c.quiz.map((q, qi) => (
                  <div key={qi}>
                    <p className="mb-2 text-sm font-semibold text-slate-800">{qi + 1}. {q.q}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {q.options.map((opt, oi) => {
                        const chosen = answers[qi] === oi;
                        const showFeedback = quizResult !== null;
                        const correct = oi === q.answer;
                        return (
                          <button
                            key={oi}
                            onClick={() => { if (quizResult === null) setAnswers((a) => ({ ...a, [qi]: oi })); }}
                            className={`rounded-lg border-2 px-4 py-2.5 text-left text-sm transition-colors ${
                              showFeedback
                                ? correct
                                  ? "border-green-400 bg-green-50 font-semibold"
                                  : chosen
                                    ? "border-red-300 bg-red-50"
                                    : "border-slate-200 text-slate-400"
                                : chosen
                                  ? "border-[var(--brand-blue)] bg-blue-50 font-semibold"
                                  : "border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {quizResult === null ? (
                <button
                  onClick={submitQuiz}
                  disabled={Object.keys(answers).length < c.quiz.length}
                  className="mt-6 w-full rounded-md bg-[var(--brand-red)] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {t("Шалгалт өгөх", "Submit Quiz")}
                </button>
              ) : (
                <div className="mt-6 space-y-3">
                  <p className={`rounded-md px-4 py-3 text-sm font-bold ${
                    quizResult.score >= Math.ceil(quizResult.total * 0.6)
                      ? "border border-green-200 bg-green-50 text-green-800"
                      : "border border-amber-200 bg-amber-50 text-amber-800"
                  }`}>
                    {t("Оноо", "Score")}: {quizResult.score}/{quizResult.total} —{" "}
                    {quizResult.score >= Math.ceil(quizResult.total * 0.6)
                      ? t("Хичээл амжилттай дууслаа! 🎉", "Lesson completed! 🎉")
                      : t("Дахин үзээд, ахин өгөөрэй.", "Review the lesson and try again.")}
                  </p>
                  <button
                    onClick={() => { setAnswers({}); setQuizResult(null); }}
                    className="w-full rounded-md border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-600 hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]"
                  >
                    {t("Дахин өгөх", "Try again")}
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- course overview ---------- */

  const pct = lessons.length ? Math.round((doneCount / lessons.length) * 100) : 0;

  return (
    <div>
      <PageHeader
        eyebrow={t("Сургалт", "Training")}
        title={t("Англи хэлний курс", "English Course")}
        subtitle="Open Frequency English — 10-Week Speaking Course (CEFR A1)"
      />
      <div className="container-page py-10">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Progress */}
          <div className="rounded-2xl border border-slate-200 p-6">
            <div className="mb-2 flex items-end justify-between">
              <p className="text-sm font-semibold text-slate-700">
                {t("Таны ахиц", "Your progress")}: {doneCount}/{lessons.length} {t("хичээл", "lessons")}
              </p>
              <p className="text-2xl font-extrabold text-[var(--brand-blue)]">{pct}%</p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-[var(--brand-blue)] transition-all" style={{ width: `${pct}%` }} />
            </div>
            {nextLesson && (
              <button
                onClick={() => openWeek(nextLesson)}
                className="mt-4 rounded-md bg-[var(--brand-red)] px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                {doneCount === 0
                  ? t("Курс эхлэх →", "Start the course →")
                  : `${t("Үргэлжлүүлэх", "Continue")}: ${t("7 хоног", "Week")} ${nextLesson.week} →`}
              </button>
            )}
          </div>

          {/* Certificate */}
          {allDone && <CourseCertificate name={memberName} lang={lang} />}

          {/* Lesson list */}
          <div className="space-y-3">
            {lessons.map((l) => {
              const p = progress[l.id];
              return (
                <button
                  key={l.id}
                  onClick={() => openWeek(l)}
                  className="flex w-full items-center gap-4 rounded-xl border border-slate-200 p-5 text-left transition-shadow hover:shadow-md"
                >
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                    p?.completed ? "bg-green-100 text-green-700" : "bg-blue-50 text-[var(--brand-blue)]"
                  }`}>
                    {p?.completed ? "✓" : l.week}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-slate-900">{l.title}</span>
                    <span className="block text-sm text-slate-500">{l.title_mn}</span>
                  </span>
                  {p?.quiz_score != null && (
                    <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      {p.quiz_score}/{p.quiz_total}
                    </span>
                  )}
                </button>
              );
            })}
            {lessons.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                {t("Хичээлүүд удахгүй нэмэгдэнэ.", "Lessons are coming soon.")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
