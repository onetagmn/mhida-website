"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/lib/supabase";
import { asset } from "@/lib/asset";
import { NewsPost, formatDate, firstYoutubeThumb } from "@/lib/news";
import NewsBody from "@/components/NewsBody";
import PdfAttachments from "@/components/PdfAttachments";

const PAGE_SIZE = 9;

type SectorItem = { id: number; url: string; title: string; source: string; published_at: string | null; hidden: boolean };

const CATEGORIES = [
  { key: "news", mn: "Мэдээ", en: "News" },
  { key: "partner", mn: "Түншлэл, сургалт", en: "Partnerships & training" },
] as const;

const categoryLabel = (c: string) => CATEGORIES.find((x) => x.key === c) ?? CATEGORIES[0];

// Card picture: the first photo, else the first YouTube video's frame.
const coverOf = (p: NewsPost) => p.image_urls[0] ?? firstYoutubeThumb(p.body);

// Plain-text teaser: links and extra spaces removed.
function excerpt(body: string, length = 180) {
  const text = body
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > length ? `${text.slice(0, length).replace(/\s\S*$/, "")}…` : text;
}

/** News: a list with a featured story, tabs and search; ?id=<post> opens one article. */
export default function NewsPage() {
  return (
    <Suspense fallback={<div className="container-page flex h-64 items-center justify-center text-slate-400">Loading...</div>}>
      <News />
    </Suspense>
  );
}

function News() {
  const { t } = useLanguage();
  const id = useSearchParams().get("id");
  const [posts, setPosts] = useState<NewsPost[] | null>(null);
  const [sector, setSector] = useState<SectorItem[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const [{ data }, sectorRes, meRes] = await Promise.all([
        supabase
          .from("news")
          .select("id, title, body, image_urls, pdf_urls, category, published, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("sector_news")
          .select("id, url, title, source, published_at, hidden")
          .order("published_at", { ascending: false, nullsFirst: false })
          .limit(80),
        session
          ? supabase.from("members").select("is_admin").eq("id", session.user.id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      setPosts(data ?? []);
      setSector((sectorRes.data as SectorItem[]) ?? []);
      setIsAdmin(!!(meRes.data as { is_admin?: boolean } | null)?.is_admin);
    })();
  }, []);

  if (posts === null) {
    return (
      <div>
        <PageHeader eyebrow={t("Мэдээ", "News")} title={t("Мэдээ мэдээлэл", "News & Announcements")} />
        <p className="py-16 text-center text-slate-400">{t("Ачааллаж байна...", "Loading...")}</p>
      </div>
    );
  }

  const open = id ? posts.find((p) => p.id === id) : null;
  if (id && open) return <Article post={open} others={posts.filter((p) => p.id !== open.id).slice(0, 3)} />;
  return <NewsList posts={posts} notFound={!!id} sector={sector} setSector={setSector} isAdmin={isAdmin} />;
}

function NewsList({
  posts, notFound, sector, setSector, isAdmin,
}: {
  posts: NewsPost[];
  notFound: boolean;
  sector: SectorItem[];
  setSector: React.Dispatch<React.SetStateAction<SectorItem[]>>;
  isAdmin: boolean;
}) {
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState<"all" | "news" | "partner" | "sector">("all");
  const [query, setQuery] = useState("");
  const [shownCount, setShownCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts
      .filter((p) => tab === "all" || p.category === tab)
      .filter((p) => !q || `${p.title} ${p.body}`.toLowerCase().includes(q));
  }, [posts, tab, query]);

  // The newest story leads the page when nothing is filtered.
  const featured = tab === "all" && !query.trim() ? filtered[0] : null;
  const rest = featured ? filtered.slice(1) : filtered;

  return (
    <div>
      <PageHeader
        eyebrow={t("Мэдээ", "News")}
        title={t("Мэдээ мэдээлэл", "News & Announcements")}
        subtitle={t(
          "Холбооны үйл ажиллагаа, сургалт, түншлэлийн мэдээ.",
          "News from the Association: activities, training and partnerships."
        )}
      />

      <div className="container-page py-8 sm:py-10">
        {notFound && (
          <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {t("Энэ мэдээ олдсонгүй — устгагдсан эсвэл холбоос буруу байна.", "This story could not be found — it may have been removed.")}
          </p>
        )}

        {/* Tabs and search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all" as const, mn: "Бүгд", en: "All" },
              ...CATEGORIES,
              ...(sector.length > 0 || isAdmin ? [{ key: "sector" as const, mn: "Салбарын мэдээ", en: "Sector news" }] : []),
            ].map((c) => (
              <button
                key={c.key}
                onClick={() => { setTab(c.key); setShownCount(PAGE_SIZE); }}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  tab === c.key ? "bg-[var(--brand-blue)] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t(c.mn, c.en)}{" "}
                <span className="opacity-70">
                  {c.key === "all"
                    ? posts.length
                    : c.key === "sector"
                      ? sector.filter((x) => !x.hidden).length
                      : posts.filter((p) => p.category === c.key).length}
                </span>
              </button>
            ))}
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShownCount(PAGE_SIZE); }}
            placeholder={t("Мэдээ хайх...", "Search news...")}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-[var(--brand-blue)] sm:w-72"
          />
        </div>

        {tab === "sector" ? (
          <SectorList items={sector} query={query} isAdmin={isAdmin} setSector={setSector} />
        ) : (
        <>
        {filtered.length === 0 && (
          <p className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            {posts.length === 0 ? t("Одоогоор мэдээ алга.", "No news yet.") : t("Хайлтад тохирох мэдээ олдсонгүй.", "No stories match your search.")}
          </p>
        )}

        {/* Featured story */}
        {featured && (
          <Link
            href={`/news?id=${featured.id}`}
            className="group mt-6 grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg md:grid-cols-5"
          >
            <Cover post={featured} className="h-56 sm:h-72 md:col-span-3 md:h-[380px]" />
            <div className="flex flex-col justify-center p-6 md:col-span-2 md:p-8">
              <Meta post={featured} lang={lang} />
              <h2 className="mt-3 text-2xl font-extrabold leading-tight text-slate-900 group-hover:text-[var(--brand-red)]">
                {featured.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{excerpt(featured.body, 260)}</p>
              <span className="mt-5 text-sm font-bold text-[var(--brand-blue)]">{t("Дэлгэрэнгүй унших →", "Read more →")}</span>
            </div>
          </Link>
        )}

        {/* Grid */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rest.slice(0, shownCount).map((p) => (
            <Link
              key={p.id}
              href={`/news?id=${p.id}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <Cover post={p} className="h-44" />
              <div className="flex flex-1 flex-col p-5">
                <Meta post={p} lang={lang} />
                <h3 className="mt-2 font-bold leading-snug text-slate-900 group-hover:text-[var(--brand-red)]">{p.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{excerpt(p.body)}</p>
              </div>
            </Link>
          ))}
        </div>

        {rest.length > shownCount && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setShownCount((n) => n + PAGE_SIZE)}
              className="rounded-md border border-[var(--brand-blue)] px-6 py-2.5 text-sm font-bold text-[var(--brand-blue)] transition-colors hover:bg-blue-50"
            >
              {t("Цааш үзэх", "Show more")}
            </button>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}

// Headlines about health insurance and health workers from other
// Mongolian sources, collected every 3 hours (sector-news.mjs in the
// private repo). Only headline, source and date are shown; the link opens
// the original article. Admins can hide an item.
function SectorList({
  items, query, isAdmin, setSector,
}: {
  items: SectorItem[];
  query: string;
  isAdmin: boolean;
  setSector: React.Dispatch<React.SetStateAction<SectorItem[]>>;
}) {
  const { t, lang } = useLanguage();
  const q = query.trim().toLowerCase();
  const shown = items.filter((x) => (isAdmin || !x.hidden) && (!q || `${x.title} ${x.source}`.toLowerCase().includes(q)));

  async function toggleHidden(item: SectorItem) {
    const { error } = await supabase.from("sector_news").update({ hidden: !item.hidden }).eq("id", item.id);
    if (!error) setSector((xs) => xs.map((x) => (x.id === item.id ? { ...x, hidden: !item.hidden } : x)));
  }

  return (
    <div className="mt-6">
      <p className="mb-4 text-xs text-slate-500">
        {t(
          "Эрүүл мэндийн даатгал, эрүүл мэндийн ажилтан, Эрүүл мэндийн яам, ЭМДЕГ-тай холбоотой бусад эх сурвалжийн мэдээ. 3 цаг тутам автоматаар шинэчлэгддэг; дэлгэрэнгүйг эх сайтаас уншина уу.",
          "Headlines about health insurance, health workers, the Ministry of Health and the health insurance agency from other sources. Updated automatically every 3 hours; read the full story on the source's site."
        )}
      </p>
      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          {t("Одоогоор салбарын мэдээ алга.", "No sector news yet.")}
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {shown.map((x) => (
            <li key={x.id} className={`flex items-start gap-3 px-5 py-4 ${x.hidden ? "bg-slate-50 opacity-60" : ""}`}>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600">{x.source}</span>
                  {x.published_at && <span className="text-slate-400">{formatDate(x.published_at, lang)}</span>}
                  {x.hidden && <span className="text-amber-700">{t("Нуугдсан", "Hidden")}</span>}
                </p>
                <a
                  href={x.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block font-semibold leading-snug text-slate-900 hover:text-[var(--brand-red)]"
                >
                  {x.title} <span className="text-slate-400">↗</span>
                </a>
              </div>
              {isAdmin && (
                <button
                  onClick={() => toggleHidden(x)}
                  className="shrink-0 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]"
                >
                  {x.hidden ? t("Нээх", "Show") : t("Нуух", "Hide")}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Article({ post, others }: { post: NewsPost; others: NewsPost[] }) {
  const { t, lang } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [first, ...morePhotos] = post.image_urls;
  // Share the story's own share page (with its picture and title for
  // Facebook) once the site has been rebuilt with it; until then the
  // plain story link.
  const [shareUrl, setShareUrl] = useState(`https://mhida.org/news/?id=${post.id}`);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(asset(`/news/p/${post.id}/`), { method: "HEAD" });
        if (res.ok) setShareUrl(`https://mhida.org/news/p/${post.id}/`);
      } catch {
        // Offline: keep the plain story link.
      }
    })();
  }, [post.id]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the address bar still has the link.
    }
  }

  return (
    <div>
      <div className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white">
        <div className="container-page max-w-3xl py-8 sm:py-10">
          <Link href="/news" className="text-sm font-semibold text-[var(--brand-blue)] hover:opacity-70">
            ← {t("Бүх мэдээ", "All news")}
          </Link>
          <div className="mt-4"><Meta post={post} lang={lang} /></div>
          <h1 className="mt-3 text-2xl font-extrabold leading-tight text-slate-900 sm:text-4xl">{post.title}</h1>
        </div>
      </div>

      <article className="container-page max-w-3xl py-8">
        {first && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={first} alt="" className="mx-auto max-h-[600px] w-auto max-w-full rounded-2xl shadow-sm" />
        )}
        {morePhotos.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {morePhotos.map((url) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-36 w-full object-cover transition-transform hover:scale-105" loading="lazy" />
              </a>
            ))}
          </div>
        )}

        <div className="mt-6 text-[15px] leading-relaxed">
          <NewsBody body={post.body} />
        </div>
        <PdfAttachments urls={post.pdf_urls} />

        {/* Share */}
        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6 text-sm">
          <span className="font-semibold text-slate-500">{t("Хуваалцах:", "Share:")}</span>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-[#1877f2] px-4 py-2 font-bold text-white transition-opacity hover:opacity-90"
          >
            Facebook
          </a>
          <button onClick={copyLink} className="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-600 hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]">
            {copied ? t("Хуулагдлаа ✓", "Copied ✓") : t("Холбоос хуулах", "Copy link")}
          </button>
        </div>
      </article>

      {others.length > 0 && (
        <section className="border-t border-slate-200 bg-slate-50">
          <div className="container-page py-8 sm:py-10">
            <h2 className="mb-5 text-xl font-bold text-slate-900">{t("Бусад мэдээ", "More news")}</h2>
            <div className="grid gap-5 sm:grid-cols-3">
              {others.map((p) => (
                <Link
                  key={p.id}
                  href={`/news?id=${p.id}`}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <Cover post={p} className="h-36" />
                  <div className="p-4">
                    <Meta post={p} lang={lang} />
                    <h3 className="mt-2 line-clamp-2 font-bold leading-snug text-slate-900 group-hover:text-[var(--brand-red)]">{p.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Meta({ post, lang }: { post: NewsPost; lang: "mn" | "en" }) {
  const { t } = useLanguage();
  const c = categoryLabel(post.category);
  return (
    <p className="flex flex-wrap items-center gap-2 text-xs font-semibold">
      <span className={`rounded-full px-2.5 py-0.5 ${post.category === "partner" ? "bg-red-50 text-[var(--brand-red)]" : "bg-blue-50 text-[var(--brand-blue)]"}`}>
        {t(c.mn, c.en)}
      </span>
      <span className="text-slate-400">{formatDate(post.created_at, lang)}</span>
    </p>
  );
}

function Cover({ post, className }: { post: NewsPost; className: string }) {
  const src = coverOf(post);
  const isVideo = !post.image_urls[0] && !!src;
  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src ?? asset("/logo.png")}
        alt=""
        loading="lazy"
        className={`h-full w-full transition-transform duration-500 group-hover:scale-105 ${src ? "object-cover" : "object-contain p-8 opacity-30"}`}
      />
      {isVideo && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 pl-1 text-xl text-white">▶</span>
        </span>
      )}
    </div>
  );
}
