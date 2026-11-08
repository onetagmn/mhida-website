import type { Metadata } from "next";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/supabase";
import { firstYoutubeThumb } from "@/lib/news";
import { pageMeta } from "@/lib/seo";
import GoToStory from "./GoToStory";

// One small page per news story, made when the site is built, carrying
// the story's own title, text and picture for the preview Facebook and
// Messenger show when the link is shared. Visitors are sent straight on
// to the story at /news?id=<id>. Stories published after the last build
// get their page at the next build (the site rebuilds every few hours).

type Post = { id: string; title: string; body: string; image_urls: string[] };

async function publishedNews(): Promise<Post[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/news?select=id,title,body,image_urls&published=eq.true&order=created_at.desc`,
    { headers: { apikey: SUPABASE_PUBLISHABLE_KEY } }
  );
  return res.ok ? res.json() : [];
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = await publishedNews();
  // A static export needs at least one page; "latest" just opens the news list.
  return posts.length ? posts.map((p) => ({ id: p.id })) : [{ id: "latest" }];
}

const teaser = (body: string) =>
  body.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim().slice(0, 200);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = (await publishedNews()).find((p) => p.id === id);
  if (!post) return pageMeta("Мэдээ мэдээлэл", "Монголын Даатгалын Эмч Нарын Холбооны мэдээ.", "/news/");
  const image = post.image_urls[0] ?? firstYoutubeThumb(post.body) ?? "/og-image.png";
  const meta = pageMeta(post.title, teaser(post.body) || "Монголын Даатгалын Эмч Нарын Холбооны мэдээ.", `/news/p/${id}/`, image);
  return { ...meta, openGraph: { ...meta.openGraph, type: "article" } };
}

export default async function NewsSharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = (await publishedNews()).find((p) => p.id === id);
  return <GoToStory id={post ? id : null} title={post?.title ?? null} />;
}
