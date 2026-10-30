"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/lib/supabase";
import CourseCertificate from "@/components/CourseCertificate";

const TOTAL_DAYS = 30;

type QuizQ = { q: string; options: string[]; answer: number };
type LessonContent = {
  objectives: string[];
  dialogue: { speaker: string; en: string; mn: string }[];
  vocab: { en: string; mn: string; example: string }[];
  grammar: { title: string; body: string; examples: string[] };
  speaking: string[];
  quiz: QuizQ[];
  pronunciation?: { word: string; hint: string }[];
  recordPrompt?: string;
};
type Lesson = {
  id: string;
  day: number;
  title: string;
  title_mn: string;
  video_url: string | null;
  content: LessonContent;
};
type Progress = { lesson_id: string; completed: boolean; quiz_score: number | null; quiz_total: number | null };

/* ---------- speech synthesis helper (shared across the lesson) ---------- */
// Ranks available browser voices so we pick the most natural-sounding
// English female voice available, instead of whatever the browser
// defaults to (often a robotic offline engine). Web Speech API voice
// quality is entirely up to the visitor's browser/OS — this can't make
// a bad engine sound like a real person, but it reliably picks the best
// one actually available (e.g. Chrome's cloud "Google US English",
// Edge's "Online (Natural)" voices, or macOS/iOS's "Samantha").
function scoreVoice(v: SpeechSynthesisVoice): number {
  const name = v.name.toLowerCase();
  let score = 0;
  if (/neural|natural/.test(name)) score += 100;
  if (/online/.test(name)) score += 20;
  if (/google/.test(name)) score += 40;
  if (/samantha|zira|aria|jenny|emma|ava|susan|karen|moira|tessa|salli|joanna|kendra|kimberly|female/.test(name)) score += 50;
  if (/male/.test(name) && !/female/.test(name)) score -= 30;
  if (!v.localService) score += 15;
  if (/en-us/i.test(v.lang)) score += 10;
  else if (/en-gb/i.test(v.lang)) score += 6;
  else if (/^en/i.test(v.lang)) score += 3;
  return score;
}

// Strips/replaces punctuation that voice engines otherwise read aloud
// literally (e.g. "wife / husband" → "wife slash husband"). Vocab entries
// across the course use "/" to show word alternatives, "·" to separate
// dialogue turns, and "…" in questions — none of that should be spoken.
function toSpeakableText(text: string): string {
  return text
    .replace(/\s*\/\s*/g, ", or ")   // "wife / husband" -> "wife, or husband"
    .replace(/[·•]/g, ".")            // dialogue-join separators -> pause
    .replace(/\.{2,}/g, "")           // "..." ellipsis (literal dots)
    .replace(/…/g, "")                // "…" ellipsis (single character)
    .replace(/\s+/g, " ")
    .trim();
}

function useSpeech() {
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    function loadVoices() {
      const vs = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang));
      voiceRef.current = vs.length ? [...vs].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] : null;
    }
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const say = useCallback((text: string, rate = 1, onEnd?: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(toSpeakableText(text));
    u.lang = voiceRef.current?.lang || "en-US";
    u.rate = rate;
    u.pitch = 1;
    if (voiceRef.current) u.voice = voiceRef.current;
    if (onEnd) {
      u.onend = onEnd;
      u.onerror = onEnd;
    }
    speechSynthesis.speak(u);
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) speechSynthesis.cancel();
  }, []);

  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  return { say, stop, supported };
}

/* ---------- click-to-play YouTube facade ---------- */
function youtubeId(url: string): string | null {
  const m =
    url.match(/youtube\.com\/watch\?(?:.*&)?v=([\w-]{6,})/) ||
    url.match(/youtu\.be\/([\w-]{6,})/) ||
    url.match(/youtube\.com\/embed\/([\w-]{6,})/);
  return m ? m[1] : null;
}

/** Direct YouTube embed — a single player, loaded once (see NewsBody.tsx for why we dropped the click-to-play facade). */
function LessonVideo({ url }: { url: string }) {
  const vid = youtubeId(url);
  if (!vid) return null;

  return (
    <div className="overflow-hidden rounded-xl">
      <iframe
        src={`https://www.youtube.com/embed/${vid}?rel=0&modestbranding=1&playsinline=1`}
        title="Lesson video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        className="aspect-video w-full"
      />
    </div>
  );
}

/* ---------- mic recorder for self-check pronunciation ---------- */
function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const toggle = useCallback(async () => {
    if (recording) {
      mediaRef.current?.stop();
      setRecording(false);
      return;
    }
    if (typeof navigator === "undefined" || !navigator.mediaDevices || !window.MediaRecorder) {
      setHint("Recording needs microphone access (works on https or localhost).");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      mediaRef.current = rec;
      setRecording(true);
      setHint(null);
    } catch {
      setHint("Microphone blocked. Allow mic access in your browser to record.");
    }
  }, [recording]);

  return { recording, audioUrl, hint, toggle };
}

export default function EnglishCoursePage() {
  const { t, lang } = useLanguage();
  const { say, stop: stopSpeech, supported: ttsSupported } = useSpeech();
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

  // dialogue sequenced-playback state
  const [dialogueLine, setDialogueLine] = useState<number | null>(null);
  const dialogueStopRef = useRef(false);

  // listening-practice (transcript hidden until revealed)
  const [transcriptShown, setTranscriptShown] = useState(false);

  const recorder = useRecorder();

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setAuthState("out"); return; }
    setUserId(session.user.id);
    const [lessonsRes, progressRes, meRes] = await Promise.all([
      supabase.from("course_lessons").select("id, day, title, title_mn, video_url, content").order("day"),
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

  // stop any speech / recording when leaving a lesson
  useEffect(() => {
    if (!openLesson) { stopSpeech(); dialogueStopRef.current = true; }
  }, [openLesson, stopSpeech]);

  const doneCount = useMemo(
    () => lessons.filter((l) => progress[l.id]?.completed).length,
    [lessons, progress]
  );
  const allDone = lessons.length > 0 && doneCount === TOTAL_DAYS;
  const nextLesson = lessons.find((l) => !progress[l.id]?.completed) ?? null;

  function openDay(l: Lesson) {
    stopSpeech();
    setOpenLesson(l);
    setAnswers({});
    setDialogueLine(null);
    setTranscriptShown(false);
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

  function playDialogue(rate: number) {
    if (!openLesson) return;
    stopSpeech();
    dialogueStopRef.current = false;
    const lines = openLesson.content.dialogue;
    let i = 0;
    const step = () => {
      if (dialogueStopRef.current || i >= lines.length) { setDialogueLine(null); return; }
      setDialogueLine(i);
      const idx = i;
      say(lines[idx].en, rate, () => {
        i++;
        setTimeout(step, 350);
      });
    };
    step();
  }
  function stopDialogue() {
    dialogueStopRef.current = true;
    stopSpeech();
    setDialogueLine(null);
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
          subtitle={`Open Frequency English — ${TOTAL_DAYS}-Day Speaking Course (CEFR A1–B1)`}
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
    const pronunciation = c.pronunciation && c.pronunciation.length > 0
      ? c.pronunciation
      : c.vocab.slice(0, 4).map((v) => ({ word: v.en, hint: t("Сонсоод, тодорхой давт.", "Listen, then repeat clearly.") }));
    const recordPrompt = c.recordPrompt || c.speaking[0] || c.dialogue[0]?.en || "";
    const fullDialogueText = c.dialogue.map((d) => `${d.speaker}: ${d.en}`).join("  ·  ");
    const nextDayLesson = lessons.find((l) => l.day === openLesson.day + 1) ?? null;
    const prevDayLesson = lessons.find((l) => l.day === openLesson.day - 1) ?? null;

    return (
      <div>
        <PageHeader
          eyebrow={`${t("Өдөр", "Day")} ${openLesson.day} / ${TOTAL_DAYS}`}
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

            {!ttsSupported && (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                {t(
                  "Таны хөтөч дуу тоглуулах функцийг дэмждэггүй. Chrome эсвэл Safari ашиглахыг зөвлөж байна.",
                  "Your browser doesn't support audio playback. Try Chrome or Safari for the listen/repeat features."
                )}
              </p>
            )}

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

            {/* Video */}
            {openLesson.video_url && (
              <section>
                <h2 className="mb-3 text-lg font-bold text-slate-900">{t("Видео хичээл", "Video Lesson")}</h2>
                <LessonVideo url={openLesson.video_url} />
              </section>
            )}

            {/* Vocabulary — Listen & Repeat */}
            <section>
              <h2 className="mb-1 text-lg font-bold text-slate-900">🔊 {t("Сонсож дагаж хэл", "Listen & Repeat — Vocabulary")}</h2>
              <p className="mb-4 text-xs text-slate-500">
                {t("Сонсоод чанга дагаж хэл. Хэдэн ч удаа давтаж болно.", "Tap Listen, then say it out loud. Repeat as many times as you like.")}
              </p>
              <div className="space-y-2">
                {c.vocab.map((v, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{v.en}</p>
                      {showMn && <p className="text-xs text-slate-500">{v.mn}</p>}
                      <p className="mt-0.5 text-xs italic text-slate-400">{v.example}</p>
                    </div>
                    <button
                      onClick={() => say(v.en, 1)}
                      disabled={!ttsSupported}
                      className="shrink-0 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)] disabled:opacity-40"
                    >
                      🔊 {t("Сонсох", "Listen")}
                    </button>
                    <button
                      onClick={() => say(v.en, 0.6)}
                      disabled={!ttsSupported}
                      className="shrink-0 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)] disabled:opacity-40"
                    >
                      🐢 {t("Удаан", "Slow")}
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Dialogue */}
            <section>
              <h2 className="mb-1 text-lg font-bold text-slate-900">{t("Яриа", "Dialogue")}</h2>
              <p className="mb-4 text-xs text-slate-500">
                {t("Бүх ярианы хэсгийг тоглуулах эсвэл мөр бүрийг сонсоно уу.", "Play the whole conversation, or listen line by line.")}
              </p>
              <div className="mb-3 flex flex-wrap gap-2">
                <button onClick={() => playDialogue(1)} disabled={!ttsSupported} className="rounded-md bg-[var(--brand-blue)] px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40">
                  ▶ {t("Яриа тоглуулах", "Play conversation")}
                </button>
                <button onClick={() => playDialogue(0.6)} disabled={!ttsSupported} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)] disabled:opacity-40">
                  🐢 {t("Удаан тоглуулах", "Play slowly")}
                </button>
                <button onClick={stopDialogue} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]">
                  ■ {t("Зогсоох", "Stop")}
                </button>
              </div>
              <div className="space-y-3">
                {c.dialogue.map((d, i) => (
                  <div
                    key={i}
                    className={`max-w-[85%] rounded-2xl border p-4 transition-colors ${
                      dialogueLine === i
                        ? "border-amber-300 bg-amber-50"
                        : i % 2 === 0 ? "border-blue-100 bg-blue-50/50" : "ml-auto border-slate-200 bg-slate-50"
                    } ${i % 2 !== 0 ? "ml-auto" : ""}`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{d.speaker}</p>
                      <button onClick={() => say(d.en, 1)} disabled={!ttsSupported} className="shrink-0 rounded-full border border-slate-300 bg-white px-2.5 py-0.5 text-xs text-slate-500 hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)] disabled:opacity-40">
                        🔊
                      </button>
                    </div>
                    <p className="font-medium text-slate-900">{d.en}</p>
                    {showMn && <p className="mt-1 text-sm text-slate-500">{d.mn}</p>}
                  </div>
                ))}
              </div>
            </section>

            {/* Listening practice */}
            <section className="rounded-2xl border border-slate-200 p-6">
              <h2 className="mb-1 text-lg font-bold text-slate-900">🎧 {t("Сонсголын дадлага", "Listening Practice")}</h2>
              <p className="mb-4 text-xs text-slate-500">
                {t(
                  "Текстийг харахгүйгээр яриаг сонс. Дараа нь бичвэрийг харж шалгаарай.",
                  "Listen to the conversation without reading it. Reveal the transcript afterward to check yourself."
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => say(fullDialogueText, 1)} disabled={!ttsSupported} className="rounded-md bg-slate-800 px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40">
                  ▶ {t("Сонсох", "Play")}
                </button>
                <button onClick={() => say(fullDialogueText, 0.62)} disabled={!ttsSupported} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)] disabled:opacity-40">
                  🐢 {t("Удаан", "Slow")}
                </button>
                <button onClick={stopSpeech} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]">
                  ■ {t("Зогсоох", "Stop")}
                </button>
              </div>
              <button
                onClick={() => setTranscriptShown((v) => !v)}
                className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-[var(--brand-blue)]"
              >
                {transcriptShown ? t("▲ Бичвэр нуух", "▲ Hide transcript") : t("▼ Бичвэр харах (эхлээд оролдоно уу)", "▼ Show transcript (try first)")}
              </button>
              {transcriptShown && (
                <p className="mt-2 rounded-md bg-slate-50 p-3 text-sm text-slate-600">{fullDialogueText}</p>
              )}
            </section>

            {/* Vocabulary table (with grammar) */}
            <section className="rounded-2xl border border-slate-200 p-6">
              <h2 className="mb-2 text-lg font-bold text-slate-900">📘 {c.grammar.title}</h2>
              <p className="text-sm text-slate-600">{c.grammar.body}</p>
              <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
                {c.grammar.examples.map((e, i) => (
                  <li key={i} className="rounded-md bg-slate-50 px-3 py-2 font-medium">{e}</li>
                ))}
              </ul>
            </section>

            {/* Pronunciation focus */}
            <section className="rounded-2xl border border-cyan-100 bg-cyan-50/40 p-6">
              <h2 className="mb-1 text-lg font-bold text-slate-900">🗣 {t("Дуудлагад анхаарах", "Pronunciation Focus")}</h2>
              <p className="mb-4 text-xs text-slate-500">
                {t("Сонсоод яг адилхан дуудахыг хичээ.", "Listen and try to copy the sound exactly.")}
              </p>
              <div className="space-y-2">
                {pronunciation.map((pr, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{pr.word}</p>
                      <p className="text-xs text-slate-500">{pr.hint}</p>
                    </div>
                    <button onClick={() => say(pr.word, 1)} disabled={!ttsSupported} className="shrink-0 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)] disabled:opacity-40">
                      🔊
                    </button>
                    <button onClick={() => say(pr.word, 0.55)} disabled={!ttsSupported} className="shrink-0 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)] disabled:opacity-40">
                      🐢
                    </button>
                  </div>
                ))}
              </div>
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

            {/* Record & self-check */}
            <section className="rounded-2xl border border-slate-200 p-6">
              <h2 className="mb-1 text-lg font-bold text-slate-900">🎙 {t("Ярьж бичиж сонс", "Speak & Record")}</h2>
              <p className="mb-4 text-xs text-slate-500">
                {t(
                  "Дараах загвар өгүүлбэрийг ярь, бичиж аваад өөрийгөө сонсож шалга.",
                  "Say the model sentence below out loud, then record yourself and listen back."
                )}
              </p>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-800">&ldquo;{recordPrompt}&rdquo;</p>
                <button onClick={() => say(recordPrompt, 1)} disabled={!ttsSupported} className="mt-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)] disabled:opacity-40">
                  🔊 {t("Загвар сонсох", "Hear a model")}
                </button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={recorder.toggle}
                  className={`rounded-md px-5 py-2.5 text-sm font-bold text-white transition-colors ${
                    recorder.recording ? "animate-pulse bg-[var(--brand-red)]" : "bg-slate-800 hover:opacity-90"
                  }`}
                >
                  {recorder.recording ? `■ ${t("Зогсоох", "Stop")}` : `● ${t("Бичих", "Record")}`}
                </button>
                <span className="text-xs text-slate-500">
                  {recorder.hint ?? t("Бичсэн дараа тоглуулж, өөрийгөө сонсоорой.", "After recording, press play to hear yourself.")}
                </span>
              </div>
              {recorder.audioUrl && (
                <audio controls src={recorder.audioUrl} className="mt-3 w-full" />
              )}
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

            {/* Day navigation — jump straight to the next lesson without going back to the list */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-6">
              {prevDayLesson ? (
                <button
                  onClick={() => openDay(prevDayLesson)}
                  className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]"
                >
                  {t(`← ${prevDayLesson.day} дэх өдөр`, `← Day ${prevDayLesson.day}`)}
                </button>
              ) : <span />}
              {nextDayLesson ? (
                <button
                  onClick={() => openDay(nextDayLesson)}
                  className="rounded-md bg-[var(--brand-blue)] px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  {t(`Дараагийн өдөр: ${nextDayLesson.day} →`, `Next: Day ${nextDayLesson.day} →`)}
                </button>
              ) : (
                <button
                  onClick={() => setOpenLesson(null)}
                  className="rounded-md bg-[var(--brand-red)] px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  {t("Бүх хичээл рүү буцах →", "Back to all lessons →")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- course overview ---------- */

  const pct = TOTAL_DAYS ? Math.round((doneCount / TOTAL_DAYS) * 100) : 0;

  return (
    <div>
      <PageHeader
        eyebrow={t("Сургалт", "Training")}
        title={t("Англи хэлний курс", "English Course")}
        subtitle={`Open Frequency English — ${TOTAL_DAYS}-Day Speaking Course (CEFR A1–B1)`}
      />
      <div className="container-page py-10">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Progress */}
          <div className="rounded-2xl border border-slate-200 p-6">
            <div className="mb-2 flex items-end justify-between">
              <p className="text-sm font-semibold text-slate-700">
                {t("Таны ахиц", "Your progress")}: {doneCount}/{TOTAL_DAYS} {t("хичээл", "lessons")}
              </p>
              <p className="text-2xl font-extrabold text-[var(--brand-blue)]">{pct}%</p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-[var(--brand-blue)] transition-all" style={{ width: `${pct}%` }} />
            </div>
            {nextLesson && (
              <button
                onClick={() => openDay(nextLesson)}
                className="mt-4 rounded-md bg-[var(--brand-red)] px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                {doneCount === 0
                  ? t("Курс эхлэх →", "Start the course →")
                  : `${t("Үргэлжлүүлэх", "Continue")}: ${t("Өдөр", "Day")} ${nextLesson.day} →`}
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
                  onClick={() => openDay(l)}
                  className="flex w-full items-center gap-4 rounded-xl border border-slate-200 p-5 text-left transition-shadow hover:shadow-md"
                >
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                    p?.completed ? "bg-green-100 text-green-700" : "bg-blue-50 text-[var(--brand-blue)]"
                  }`}>
                    {p?.completed ? "✓" : l.day}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-slate-900">{l.title}</span>
                    <span className="block text-sm text-slate-500">{l.title_mn}</span>
                  </span>
                  {l.video_url && <span className="shrink-0 text-lg">🎬</span>}
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
