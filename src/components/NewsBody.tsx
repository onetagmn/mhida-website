"use client";

import React, { useState } from "react";
import { useLanguage } from "@/lib/language-context";

// Matches full URLs AND protocol-less YouTube links (people often paste
// "youtube.com/watch?v=..." or "www.youtube.com/..." without https://).
const URL_RE = /(https?:\/\/[^\s<>"']+|(?:www\.)?(?:m\.)?youtube\.com\/[^\s<>"']+|youtu\.be\/[^\s<>"']+)/g;

function youtubeId(url: string): string | null {
  const m =
    url.match(/youtube\.com\/watch\?(?:.*&)?v=([\w-]{6,})/) ||
    url.match(/youtu\.be\/([\w-]{6,})/) ||
    url.match(/youtube\.com\/shorts\/([\w-]{6,})/) ||
    url.match(/youtube\.com\/live\/([\w-]{6,})/) ||
    url.match(/youtube\.com\/embed\/([\w-]{6,})/);
  return m ? m[1] : null;
}

function fullHref(url: string): string {
  return /^https?:\/\//.test(url) ? url : `https://${url}`;
}

/**
 * Renders news body text: preserves line breaks, makes URLs clickable,
 * and embeds a YouTube player for every YouTube link found.
 */
export default function NewsBody({ body }: { body: string }) {
  const videoIds: string[] = [];
  const parts = body.split(URL_RE);

  const rendered = parts.map((part, i) => {
    if (i % 2 === 1) {
      // odd indexes are URLs (capture group)
      const vid = youtubeId(part);
      if (vid && !videoIds.includes(vid)) videoIds.push(vid);
      return (
        <a
          key={i}
          href={fullHref(part)}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all font-medium text-[var(--brand-blue)] underline decoration-blue-200 underline-offset-2 hover:text-[var(--brand-red)]"
        >
          {part}
        </a>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });

  return (
    <div>
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{rendered}</div>
      {videoIds.map((vid) => (
        <VideoEmbed key={vid} vid={vid} />
      ))}
    </div>
  );
}

/**
 * Click-to-play YouTube facade: shows the video thumbnail with a play
 * button; the real player iframe loads only after the user clicks.
 * (Faster page loads, and privacy/ad blockers don't blank it out.)
 */
function VideoEmbed({ vid }: { vid: string }) {
  const { t } = useLanguage();
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="mt-4 overflow-hidden rounded-xl">
        <iframe
          src={`https://www.youtube.com/embed/${vid}?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1`}
          title="Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="aspect-video w-full"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group relative mt-4 block w-full overflow-hidden rounded-xl"
      aria-label="Play video"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://img.youtube.com/vi/${vid}/hqdefault.jpg`}
        alt=""
        className="aspect-video w-full object-cover"
        loading="lazy"
      />
      <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/35">
        <span className="flex items-center gap-2 rounded-full bg-[var(--brand-blue)]/90 px-5 py-2.5 text-sm font-bold text-white shadow-lg backdrop-blur-sm">
          <span className="inline-block h-0 w-0 border-y-[7px] border-l-[11px] border-y-transparent border-l-white" />
          {t("Тоглуулах", "Play")}
        </span>
      </span>
    </button>
  );
}
